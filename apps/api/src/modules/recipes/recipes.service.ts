import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from 'src/db/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeStatus } from 'src/generated/prisma/enums';
import { Recipe, RecipeIngredient } from 'src/generated/prisma/client';
import { UsersService } from '../users/users.service'
import { RecipeWhereInput } from 'src/generated/prisma/models/Recipe';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
    private userService: UsersService,
    private redis: RedisService,
  ) { }

  private readonly logger = new Logger(RecipesService.name);

  private validateOrderIndices(orderIndices: number[]): void {
    const sortedIndices = [...orderIndices].sort((a, b) => a - b);

    if (sortedIndices.length === 0) {
      throw new BadRequestException('At least one step is required');
    }

    if (orderIndices.length !== new Set(orderIndices).size) {
      throw new BadRequestException('Order index can not be duplicated');
    }

    if (sortedIndices[0] !== 1) {
      throw new BadRequestException('order_index must start from 1');
    }

    for (let i = 0; i < sortedIndices.length - 1; i++) {
      if (sortedIndices[i + 1] !== sortedIndices[i]! + 1) {
        throw new BadRequestException('Order index must be continuous');
      }
    }
  }

  async create(user_id: string, dto: CreateRecipeDto) {
    const user = this.userService.findOne(user_id);
    if (!user) throw new BadRequestException('User is not exist');

    const orderIndices = dto.steps.map((step) => step.order_index);
    this.validateOrderIndices(orderIndices);

    return await this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          title: dto.title,
          description: dto.description,
          author_id: user_id,
          cooking_time: dto.cooking_time,
          servings: dto.servings,
          thumbnail_url: dto.thumbnail_url,
          status: RecipeStatus.DRAFT,

          steps: {
            create: dto.steps.map((step) => ({
              order_index: step.order_index,
              image_url: step.image_url,
              content: step.content,
            })),
          },
        },
        include: {
          steps: {
            orderBy: { order_index: 'asc' },
          },
        },
      });

      const recipeIngredients: RecipeIngredient[] = [];
      for (const items of dto.ingredients) {
        // Add new ingredient if it not in db
        const ingredient = await this.ingredientsService.upsertByName(
          items.name,
          tx,
        );

        const recipeIngredient = await tx.recipeIngredient.create({
          data: {
            recipe_id: recipe.id,
            ingredient_id: ingredient.id,
            quantity: items.quantity,
            unit: items.unit,
          },
          include: {
            ingredient: true,
          },
        });
        recipeIngredients.push(recipeIngredient);
      }

      return {
        recipe,
        ingredients: recipeIngredients,
      };
    });
  }

  async findAll(params: { page: number; limit: number; search?: string }): Promise<Recipe[]> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const whereCondition: RecipeWhereInput = {
      // status: 'PUBLISHED',
    };

    if (search) {
      whereCondition.OR = [
        {
          title: { contains: search, mode: 'insensitive' },
        },
        {
          ingredients: {
            some: {
              ingredient: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        },
      ];
    }
    const recipes = await this.prisma.recipe.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatar_url: true,
            role: true,
          }
        },
        ingredients: {
          select: {
            quantity: true,
            unit: true,
            ingredient: true,
          }
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          }
        }
      },
    });

    return recipes.map((recipe) => {
      const { _count, ...rest } = recipe;
      return {
        ...rest,
        comments_count: _count.comments,
        likes_count: _count.likes,
      };
    });
  }

  async findOne(id: number, user_id?: string | undefined) {
    const cacheKey = `recipe:${id}`;

    let recipeData = await this.redis.getCache(cacheKey);
    if (!recipeData) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              avatar_url: true,
              role: true,
            },
          },
          ingredients: {
            select: {
              quantity: true,
              unit: true,
              ingredient: true,
            }
          },
          steps: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            }
          }
        }
      });

      if (!recipe) throw new NotFoundException('Recipe is not exist');

      const { _count, ...rest } = recipe;
      recipeData = {
        ...rest,
        comments_count: _count.comments,
        likes_count: _count.likes,
      };

      await this.redis.setCache(cacheKey, recipeData, 60);
    }
    const is_liked = user_id ?
      await this.checkUserLiked(user_id, id)
      : false;

    return {
      ...recipeData,
      is_liked,
    }
  }

  async update(id: number, user_id: string, updateRecipeDto: UpdateRecipeDto) {
    const { ingredients, steps, ...scalarFields } = updateRecipeDto;
    const cacheKey = `recipe:id`;

    const oldRecipe = await this.findOne(id);
    if (!oldRecipe) throw new NotFoundException('Recipe not found');
    if (oldRecipe.author_id !== user_id)
      throw new UnauthorizedException('You have no right to perform this action');

    await this.redis.delCache(cacheKey);

    return await this.prisma.$transaction(async (tx) => {
      const updateRecipe = await tx.recipe.update({
        where: { id },
        data: scalarFields,
      });

      if (ingredients && ingredients.length > 0) {
        this.logger.log(`Deleting ingredients of recipe: ${id}`);
        await tx.recipeIngredient.deleteMany({
          where: { recipe_id: id }
        });

        for (const item of ingredients) {
          const ingredient = await this.ingredientsService.upsertByName(
            item.name,
            tx
          );

          await tx.recipeIngredient.create({
            data: {
              recipe_id: id,
              ingredient_id: ingredient.id,
              quantity: item.quantity,
              unit: item.unit,
            },
          });
          this.logger.log(`An ingredient has been created`);
        }
      }

      if (steps && steps.length > 0) {
        this.logger.log(`Deleting steps of recipe: ${id}`);
        await tx.step.deleteMany({
          where: { recipe_id: id }
        });

        await tx.step.createMany({
          data: steps.map((step) => ({
            recipe_id: id,
            order_index: step.order_index,
            content: step.content,
            image_url: step.image_url,
          })),
        });
        this.logger.log(`${steps.length} steps have been created`);
      }

      return await tx.recipe.findUnique({
        where: { id },
        include: {
          ingredients: {
            select: {
              quantity: true,
              unit: true,
              ingredient: true,
            }
          },
          steps: { orderBy: { order_index: 'asc' } },
        },
      });
    })
  }

  private async checkUserLiked(user_id: string, recipe_id: number) {
    const like = await this.prisma.like.findUnique({
      where: {
        user_id_recipe_id: { user_id, recipe_id },
      },
      select: { user_id: true },
    });

    return !!like;
  }

  async likeRecipe(user_id: string, recipe_id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipe_id },
      select: { author_id: true }
    });

    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author_id === user_id)
      throw new BadRequestException('You cannot like your own recipe');

    const isLiked = await this.checkUserLiked(user_id, recipe_id);
    if (isLiked) {
      await this.prisma.like.delete({
        where: {
          user_id_recipe_id: {
            user_id,
            recipe_id,
          },
        },
      });
      return { is_liked: false };
    } else {
      await this.prisma.like.create({
        data: {
          user_id,
          recipe_id,
        },
      });
      return { is_liked: true };
    }
  }

  async getUserRecipes(user_id: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { author_id: user_id },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      }
    });

    return recipes.map((recipe) => {
      const { _count, ...recipeData } = recipe;
      return {
        ...recipeData,
        comments_count: _count.comments,
        likes_count: _count.likes,
      };
    });
  }
}
