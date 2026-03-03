import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeStatus } from 'src/generated/prisma/enums';
import { RecipeIngredient } from 'src/generated/prisma/client';
import { UsersService } from '../users/users.service';
import { RecipeWhereInput } from 'src/generated/prisma/models/Recipe';
import { RedisService } from 'src/common/redis/redis.service';
import { RecipeDetail } from './dto/recipe-detail.dto';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationType,
  NotificationResourceType,
} from 'src/generated/prisma/enums';
import { NotificationMessages, ErrorMessages } from 'src/common/constants';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
    private userService: UsersService,
    private redis: RedisService,
    private notificationService: NotificationService,
  ) {}

  private readonly logger = new Logger(RecipesService.name);

  private validateOrderIndices(orderIndices: number[]): void {
    const sortedIndices = [...orderIndices].sort((a, b) => a - b);

    if (sortedIndices.length === 0) {
      throw new BadRequestException(ErrorMessages.AT_LEAST_ONE_STEP);
    }

    if (orderIndices.length !== new Set(orderIndices).size) {
      throw new BadRequestException(ErrorMessages.DUPLICATE_ORDER_INDEX);
    }

    if (sortedIndices[0] !== 1) {
      throw new BadRequestException(ErrorMessages.ORDER_INDEX_START_FROM_1);
    }

    for (let i = 0; i < sortedIndices.length - 1; i++) {
      if (sortedIndices[i + 1] !== sortedIndices[i]! + 1) {
        throw new BadRequestException(ErrorMessages.ORDER_INDEX_CONTINUOUS);
      }
    }
  }

  async create(user_id: string, dto: CreateRecipeDto) {
    const user = await this.userService.findOne(user_id);
    if (!user) throw new BadRequestException(ErrorMessages.USER_NOT_FOUND);

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

  async findAll(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const whereCondition: RecipeWhereInput = {
      // status: 'PUBLISHED',
      deleted_at: null,
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
      select: {
        id: true,
        title: true,
        author_id: true,
        thumbnail_url: true,
        cooking_time: true,
        servings: true,
        created_at: true,
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
            ingredient: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
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

  async findOne(id: string, user_id?: string) {
    const cacheKey = `recipe:${id}`;

    let recipeData =
      await this.redis.getCache<Omit<RecipeDetail, 'is_liked'>>(cacheKey);
    if (!recipeData) {
      const recipe = await this.prisma.recipe.findUnique({
        where: {
          id,
          deleted_at: null,
        },
        select: {
          id: true,
          author_id: true,
          title: true,
          thumbnail_url: true,
          cooking_time: true,
          servings: true,
          created_at: true,
          user: {
            select: {
              username: true,
              avatar_url: true,
            },
          },
          ingredients: {
            select: {
              quantity: true,
              unit: true,
              ingredient: {
                select: { name: true },
              },
            },
          },
          steps: {
            select: {
              order_index: true,
              image_url: true,
              content: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      });

      if (!recipe) throw new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND);

      const { _count, ...rest } = recipe;
      recipeData = {
        ...rest,
        comments_count: _count.comments,
        likes_count: _count.likes,
      } as Omit<RecipeDetail, 'is_liked'>;

      await this.redis.setCache(cacheKey, recipeData, 10);
    }
    const is_liked = user_id ? await this.checkUserLiked(user_id, id) : false;

    // Ensure we only return the allowed user fields, even if cache was malformed
    const safeRecipeData = {
      ...recipeData,
      user: {
        username: recipeData.user.username,
        avatar_url: recipeData.user.avatar_url,
      },
    };

    return {
      ...safeRecipeData,
      is_liked,
    };
  }

  async update(id: string, user_id: string, updateRecipeDto: UpdateRecipeDto) {
    const { ingredients, steps, ...scalarFields } = updateRecipeDto;
    const cacheKey = `recipe:${id}`;

    const oldRecipe = await this.findOne(id);
    if (!oldRecipe) throw new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND);

    if (oldRecipe.author_id !== user_id)
      throw new UnauthorizedException(ErrorMessages.NO_PERMISSION);

    await this.redis.delCache(cacheKey);

    return await this.prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id },
        data: scalarFields,
      });

      if (ingredients && ingredients.length > 0) {
        this.logger.log(`Deleting ingredients of recipe: ${id}`);
        await tx.recipeIngredient.deleteMany({
          where: { recipe_id: id },
        });

        for (const item of ingredients) {
          const ingredient = await this.ingredientsService.upsertByName(
            item.name,
            tx,
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
          where: { recipe_id: id },
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
            },
          },
          steps: { orderBy: { order_index: 'asc' } },
        },
      });
    });
  }

  private async checkUserLiked(user_id: string, recipe_id: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        user_id_recipe_id: { user_id, recipe_id },
      },
      select: { user_id: true },
    });

    return !!like;
  }

  async likeRecipe(user_id: string, recipe_id: string) {
    const user = await this.userService.findOne(user_id);
    if (!user) throw new BadRequestException(ErrorMessages.USER_NOT_FOUND);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipe_id },
      select: { author_id: true, title: true },
    });

    if (!recipe) throw new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND);
    if (recipe.author_id === user_id)
      throw new BadRequestException(ErrorMessages.CANNOT_LIKE_OWN_RECIPE);

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

      // Trigger Notification
      if (recipe.author_id !== user_id) {
        await this.notificationService.createNotification({
          receiverId: recipe.author_id,
          senderId: user_id,
          type: NotificationType.LIKE,
          message: NotificationMessages.LIKE_RECIPE(
            user.username,
            recipe.title,
          ),
          resourceId: recipe_id,
          resourceType: NotificationResourceType.RECIPE,
        });
      }
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
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
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
