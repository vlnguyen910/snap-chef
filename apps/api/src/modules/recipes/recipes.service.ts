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
import { Prisma, RecipeIngredient, Step } from 'src/generated/prisma/client';
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
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
    private userService: UsersService,
    private redis: RedisService,
    private notificationService: NotificationService,
  ) {}

  async create(user_id: string, dto: CreateRecipeDto) {
    const user = await this.userService.findOne(user_id);
    if (!user) throw new BadRequestException(ErrorMessages.USER_NOT_FOUND);
    await this.checkValidCategories(dto.category_slugs);
    this.validateOrderIndices(dto.steps.map((step) => step.order_index));

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
          categories: {
            connect: dto.category_slugs?.map((slug) => ({ slug })),
          },
        },
        include: {
          categories: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const steps = await this.processSteps(tx, recipe.id, dto.steps);
      const ingredients = await this.processIngredients(
        tx,
        recipe.id,
        dto.ingredients,
      );

      return {
        recipe: { ...recipe, steps },
        ingredients,
      };
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    category_slugs?: string[];
  }) {
    const { page, limit, search, category_slugs } = params;
    const skip = (page - 1) * limit;

    const whereCondition: RecipeWhereInput = {
      status: 'PUBLISHED',
      deleted_at: null,
    };

    if (category_slugs && category_slugs.length > 0) {
      whereCondition.categories = {
        some: { slug: { in: category_slugs } },
      };
    }

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
            avatar_url: true,
          },
        },
        categories: {
          select: {
            name: true,
            slug: true,
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

    return recipes.map(this.mapRecipeCounts);
  }

  async findOne(id: string, user_id?: string) {
    const cacheKey = `recipe:${id}`;

    let recipeData =
      await this.redis.getCache<Omit<RecipeDetail, 'is_liked'>>(cacheKey);
    if (!recipeData) {
      recipeData = await this.fetchRecipeFromDatabase(id);
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
    const { ingredients, steps, category_slugs, ...scalarFields } =
      updateRecipeDto;
    const cacheKey = `recipe:${id}`;

    const oldRecipe = await this.findOne(id);
    if (!oldRecipe) throw new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND);

    if (oldRecipe.author_id !== user_id)
      throw new UnauthorizedException(ErrorMessages.NO_PERMISSION);

    await this.redis.delCache(cacheKey);

    if (category_slugs) {
      await this.checkValidCategories(category_slugs);
    }

    if (steps) {
      this.validateOrderIndices(steps.map((step) => step.order_index));
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id },
        data: {
          ...(scalarFields as Parameters<typeof tx.recipe.update>[0]['data']),
          ...(category_slugs && {
            categories: {
              set: category_slugs.map((slug) => ({ slug })),
            },
          }),
        },
      });

      if (ingredients && ingredients.length > 0) {
        this.logger.log(`Deleting ingredients of recipe: ${id}`);
        await tx.recipeIngredient.deleteMany({
          where: { recipe_id: id },
        });

        await this.processIngredients(tx, id, ingredients);
      }

      if (steps && steps.length > 0) {
        this.logger.log(`Deleting steps of recipe: ${id}`);
        await tx.step.deleteMany({
          where: { recipe_id: id },
        });

        await this.processSteps(tx, id, steps);
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
          categories: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });
    });
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

    return recipes.map(this.mapRecipeCounts);
  }

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

  private async processIngredients(
    tx: Prisma.TransactionClient,
    recipeId: string,
    ingredients: { name: string; quantity: number; unit: string }[],
  ): Promise<RecipeIngredient[]> {
    const recipeIngredients: RecipeIngredient[] = [];
    for (const item of ingredients) {
      // Add new ingredient if it not in db
      const ingredient = await this.ingredientsService.upsertByName(
        item.name,
        tx,
      );

      const recipeIngredient = await tx.recipeIngredient.create({
        data: {
          recipe_id: recipeId,
          ingredient_id: ingredient.id,
          quantity: item.quantity,
          unit: item.unit,
        },
        include: {
          ingredient: true,
        },
      });
      recipeIngredients.push(recipeIngredient);
    }
    this.logger.log(`Ingredients have been created updated`);
    return recipeIngredients;
  }

  private async processSteps(
    tx: Prisma.TransactionClient,
    recipeId: string,
    steps: { order_index: number; content: string; image_url?: string }[],
  ): Promise<Step[]> {
    await tx.step.createMany({
      data: steps.map((step) => ({
        recipe_id: recipeId,
        order_index: step.order_index,
        content: step.content,
        image_url: step.image_url,
      })),
    });
    this.logger.log(`${steps.length} steps have been created / updated`);

    return tx.step.findMany({
      where: { recipe_id: recipeId },
      orderBy: { order_index: 'asc' },
    });
  }

  private async fetchRecipeFromDatabase(
    id: string,
  ): Promise<Omit<RecipeDetail, 'is_liked'>> {
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
        categories: {
          select: {
            name: true,
            slug: true,
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

    return this.mapRecipeCounts(recipe) as Omit<RecipeDetail, 'is_liked'>;
  }

  private mapRecipeCounts = <
    T extends { _count?: { comments: number; likes: number } | null },
  >(
    recipe: T,
  ): Omit<T, '_count'> & { comments_count: number; likes_count: number } => {
    const { _count, ...rest } = recipe;
    return {
      ...rest,
      comments_count: _count?.comments || 0,
      likes_count: _count?.likes || 0,
    };
  };

  private async checkUserLiked(user_id: string, recipe_id: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        user_id_recipe_id: { user_id, recipe_id },
      },
      select: { user_id: true },
    });

    return !!like;
  }

  private async checkValidCategories(category_slugs?: string[]): Promise<void> {
    if (!category_slugs || category_slugs.length === 0) return;

    const uniqueSlugs = new Set(category_slugs);
    if (uniqueSlugs.size !== category_slugs.length) {
      throw new BadRequestException(ErrorMessages.DUPLICATE_CATEGORIES);
    }

    const existingCategories = await this.prisma.category.findMany({
      where: {
        slug: { in: category_slugs },
      },
      select: { slug: true },
    });
    const existingSlugs = existingCategories.map((category) => category.slug);
    const invalidSlugs = category_slugs.filter(
      (slug) => !existingSlugs.includes(slug),
    );
    if (invalidSlugs.length > 0) {
      throw new BadRequestException(
        `Invalid categories: ${invalidSlugs.join(', ')}`,
      );
    }
  }
}
