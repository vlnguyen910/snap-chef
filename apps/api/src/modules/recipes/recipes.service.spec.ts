import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { UsersService } from '../users/users.service';
import { RedisService } from 'src/common/redis/redis.service';
import { NotificationService } from '../notifications/notification.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RecipeStatus } from 'src/generated/prisma/enums';
import { ErrorMessages } from 'src/common/constants';
import {
  NotificationType,
  NotificationResourceType,
} from 'src/generated/prisma/enums';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  username: 'testuser',
  email: 'test@example.com',
};

const mockAuthor = { ...mockUser, id: 'author-uuid-1', username: 'author' };

const mockCategories = [
  { name: 'Italian', slug: 'italian' },
  { name: 'Pasta', slug: 'pasta' },
];

const mockRecipe = {
  id: 'recipe-uuid-1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  author_id: mockAuthor.id,
  cooking_time: 30,
  servings: 4,
  thumbnail_url: 'https://example.com/thumb.jpg',
  status: RecipeStatus.DRAFT,
  deleted_at: null,
  created_at: new Date(),
  steps: [{ order_index: 1, content: 'Step 1', image_url: null }],
  user: { username: 'author', avatar_url: null },
  ingredients: [],
  categories: mockCategories,
};

const mockRecipeWithCount = {
  ...mockRecipe,
  _count: { comments: 5, likes: 10 },
};

// ─── Mock Dependencies ────────────────────────────────────────────────────────

// Strongly-typed shape for our Prisma mock so downstream mock.calls accesses
// are not `any` and satisfy the ESLint `no-unsafe-*` rules.
type MockPrismaService = {
  $transaction: jest.Mock;
  recipe: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  recipeIngredient: { create: jest.Mock; deleteMany: jest.Mock };
  step: { deleteMany: jest.Mock; createMany: jest.Mock; findMany: jest.Mock };
  like: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
  category: { findMany: jest.Mock };
};

// Mock prisma.$transaction để gọi callback ngay lập tức với chính mockPrismaService
const mockTransaction = jest.fn(
  (cb: (tx: MockPrismaService) => Promise<unknown>) =>
    // We use a forward reference via a getter; the object itself is defined below.
    cb(mockPrismaService),
);

const mockPrismaService: MockPrismaService = {
  $transaction: mockTransaction,
  recipe: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  recipeIngredient: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  step: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  like: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
};

const mockIngredientsService = {
  upsertByName: jest.fn(),
};

const mockUsersService = {
  findOne: jest.fn(),
};

const mockRedisService = {
  getCache: jest.fn(),
  setCache: jest.fn(),
  delCache: jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('RecipesService', () => {
  let service: RecipesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: IngredientsService, useValue: mockIngredientsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 1: Khởi tạo
  // ──────────────────────────────────────────────────────────────────────────
  describe('initialization', () => {
    /**
     * Kiểm tra NestJS inject đủ dependencies.
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 2: create() — bao gồm validateOrderIndices()
  // Tạo recipe mới trong transaction: recipe + steps + ingredients.
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const validDto = {
      title: 'Pasta',
      description: 'Yummy',
      cooking_time: 20,
      servings: 2,
      thumbnail_url: 'https://example.com/thumb.jpg',
      steps: [{ order_index: 1, content: 'Boil water' }],
      ingredients: [{ name: 'Pasta', quantity: 200, unit: 'g' }],
      category_slugs: ['italian', 'pasta'],
    };

    beforeEach(() => {
      mockUsersService.findOne.mockResolvedValue(mockAuthor);
      mockPrismaService.category.findMany.mockResolvedValue(
        mockCategories.map((c) => ({ slug: c.slug })),
      );
      mockPrismaService.recipe.create.mockResolvedValue(mockRecipe);
      mockPrismaService.step.findMany.mockResolvedValue(mockRecipe.steps);
      mockIngredientsService.upsertByName.mockResolvedValue({
        id: 'ingredient-uuid-1',
      });
      mockPrismaService.recipeIngredient.create.mockResolvedValue({});
    });

    /**
     * Happy path: user tồn tại, steps hợp lệ → tạo recipe, steps, ingredients trong transaction.
     */
    it('should create a recipe with steps and ingredients in a transaction', async () => {
      const result = await service.create(mockAuthor.id, validDto);

      expect(result).toHaveProperty('recipe');
      expect(result).toHaveProperty('ingredients');
      expect(result.recipe).toHaveProperty('categories');
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.recipe.create).toHaveBeenCalledTimes(1);
    });

    /**
     * Tạo recipe với category_slugs → Prisma connect categories và include trong kết quả.
     */
    it('should connect categories and include them in the response', async () => {
      await service.create(mockAuthor.id, validDto);

      expect(mockPrismaService.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: {
              connect: [{ slug: 'italian' }, { slug: 'pasta' }],
            },
          }),
          include: expect.objectContaining({
            categories: expect.objectContaining({
              select: expect.objectContaining({
                name: true,
                slug: true,
              }),
            }),
          }),
        }),
      );
    });

    /**
     * Tạo recipe không có category_slugs → categories connect undefined.
     */
    it('should handle create without category_slugs', async () => {
      const dtoWithoutCategories = { ...validDto };
      delete (dtoWithoutCategories as Record<string, unknown>).category_slugs;

      await service.create(mockAuthor.id, dtoWithoutCategories);

      expect(mockPrismaService.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: { connect: undefined },
          }),
        }),
      );
    });

    /**
     * Gửi category_slugs trùng nhau → BadRequestException: DUPLICATE_CATEGORIES.
     */
    it('should throw BadRequestException if category_slugs are duplicated', async () => {
      const dtoDuplicateCategories = {
        ...validDto,
        category_slugs: ['italian', 'italian'],
      };

      await expect(
        service.create(mockAuthor.id, dtoDuplicateCategories),
      ).rejects.toThrow(
        new BadRequestException(ErrorMessages.DUPLICATE_CATEGORIES),
      );
      expect(mockPrismaService.recipe.create).not.toHaveBeenCalled();
    });

    /**
     * Gửi category_slugs không tồn tại trong DB → BadRequestException: Invalid categories.
     */
    it('should throw BadRequestException if category_slugs do not exist in DB', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { slug: 'italian' },
      ]);

      const dtoInvalidCategory = {
        ...validDto,
        category_slugs: ['italian', 'non-existent'],
      };

      await expect(
        service.create(mockAuthor.id, dtoInvalidCategory),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.recipe.create).not.toHaveBeenCalled();
    });

    /**
     * User không tồn tại → BadRequestException trước khi vào transaction.
     */
    it('should throw BadRequestException if user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.create(mockAuthor.id, validDto)).rejects.toThrow(
        new BadRequestException(ErrorMessages.USER_NOT_FOUND),
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    /**
     * Steps rỗng: validateOrderIndices ném lỗi AT_LEAST_ONE_STEP.
     */
    it('should throw BadRequestException if steps array is empty', async () => {
      const dtoNoSteps = { ...validDto, steps: [] };

      await expect(service.create(mockAuthor.id, dtoNoSteps)).rejects.toThrow(
        new BadRequestException(ErrorMessages.AT_LEAST_ONE_STEP),
      );
    });

    /**
     * Steps không bắt đầu từ 1 → BadRequestException: ORDER_INDEX_START_FROM_1.
     */
    it('should throw BadRequestException if order_index does not start from 1', async () => {
      const dtoWrongStart = {
        ...validDto,
        steps: [{ order_index: 2, content: 'Step 2' }],
      };

      await expect(
        service.create(mockAuthor.id, dtoWrongStart),
      ).rejects.toThrow(
        new BadRequestException(ErrorMessages.ORDER_INDEX_START_FROM_1),
      );
    });

    /**
     * Steps có order_index trùng lặp → BadRequestException: DUPLICATE_ORDER_INDEX.
     */
    it('should throw BadRequestException if order indices are duplicated', async () => {
      const dtoDuplicates = {
        ...validDto,
        steps: [
          { order_index: 1, content: 'Step 1' },
          { order_index: 1, content: 'Duplicate' },
        ],
      };

      await expect(
        service.create(mockAuthor.id, dtoDuplicates),
      ).rejects.toThrow(
        new BadRequestException(ErrorMessages.DUPLICATE_ORDER_INDEX),
      );
    });

    /**
     * Steps không liên tục (vd: 1, 3) → BadRequestException: ORDER_INDEX_CONTINUOUS.
     */
    it('should throw BadRequestException if order indices are not continuous', async () => {
      const dtoGap = {
        ...validDto,
        steps: [
          { order_index: 1, content: 'Step 1' },
          { order_index: 3, content: 'Step 3' },
        ],
      };

      await expect(service.create(mockAuthor.id, dtoGap)).rejects.toThrow(
        new BadRequestException(ErrorMessages.ORDER_INDEX_CONTINUOUS),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: findAll()
  // Lấy danh sách recipe với pagination, search và mapping _count.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    const params = { page: 1, limit: 10 };

    /**
     * Trả về danh sách recipe với comments_count và likes_count được map từ _count.
     */
    it('should return mapped recipes with counts', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([
        mockRecipeWithCount,
      ]);

      const result = await service.findAll(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('comments_count', 5);
      expect(result[0]).toHaveProperty('likes_count', 10);
      expect(result[0]).not.toHaveProperty('_count');
    });

    /**
     * Pagination: skip = (page-1) * limit được truyền vào Prisma.
     */
    it('should apply correct skip and take for pagination', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([]);

      await service.findAll({ page: 3, limit: 5 });

      expect(mockPrismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    /**
     * Search query: whereCondition.OR bao gồm filter theo title và ingredient name.
     */
    it('should include search filter in where condition', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([]);

      await service.findAll({ ...params, search: 'pasta' });

      const mockCalls = mockPrismaService.recipe.findMany.mock.calls;
      const firstCall = mockCalls[0] as unknown[];
      const call = firstCall[0] as {
        where: { OR?: unknown[]; status?: unknown };
      };
      expect(call.where.OR).toBeDefined();

      expect(call.where.OR![0]).toMatchObject({
        title: { contains: 'pasta', mode: 'insensitive' },
      });
    });

    /**
     * Filter theo category_slugs: whereCondition.categories.some được set.
     */
    it('should include category filter in where condition', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([]);

      await service.findAll({
        ...params,
        category_slugs: ['italian', 'pasta'],
      });

      const mockCalls = mockPrismaService.recipe.findMany.mock.calls;
      const firstCall = mockCalls[0] as unknown[];
      const call = firstCall[0] as {
        where: { categories?: { some: { slug: { in: string[] } } } };
      };
      expect(call.where.categories).toEqual({
        some: { slug: { in: ['italian', 'pasta'] } },
      });
    });

    /**
     * Không có recipe nào → trả về mảng rỗng.
     */
    it('should return empty array when no recipes exist', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([]);

      const result = await service.findAll(params);

      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: findOne()
  // Lấy chi tiết recipe theo ID, dùng Redis cache.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    const recipeData = {
      ...mockRecipe,
      comments_count: 5,
      likes_count: 10,
    };

    /**
     * Cache hit: Redis trả về recipe → không query DB.
     */
    it('should return cached recipe without hitting the database', async () => {
      mockRedisService.getCache.mockResolvedValue(recipeData);
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.findOne(mockRecipe.id);

      expect(result).toHaveProperty('is_liked', false);
      expect(mockPrismaService.recipe.findUnique).not.toHaveBeenCalled();
    });

    /**
     * Cache miss: query DB → cache kết quả → return.
     */
    it('should fetch from DB and cache when cache is empty', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.recipe.findUnique.mockResolvedValue(
        mockRecipeWithCount,
      );
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      await service.findOne(mockRecipe.id);

      expect(mockPrismaService.recipe.findUnique).toHaveBeenCalledTimes(1);
      expect(mockRedisService.setCache).toHaveBeenCalledWith(
        `recipe:${mockRecipe.id}`,
        expect.objectContaining({ id: mockRecipe.id }),
        10,
      );
    });

    /**
     * Recipe không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if recipe is not found', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.recipe.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND),
      );
    });

    /**
     * Truyền user_id: kiểm tra user đã like recipe hay chưa.
     */
    it('should include is_liked=true if user has liked the recipe', async () => {
      mockRedisService.getCache.mockResolvedValue(recipeData);
      mockPrismaService.like.findUnique.mockResolvedValue({
        user_id: mockUser.id,
      });

      const result = await service.findOne(mockRecipe.id, mockUser.id);

      expect(result.is_liked).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: update()
  // Cập nhật recipe trong transaction. Kiểm tra quyền author.
  // ──────────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    const recipeData = {
      ...mockRecipe,
      comments_count: 0,
      likes_count: 0,
      is_liked: false,
    };

    const updatedRecipe = {
      ...mockRecipe,
      title: 'Updated Title',
      ingredients: [],
      steps: [],
      categories: [{ name: 'Dessert', slug: 'dessert' }],
    };

    beforeEach(() => {
      // findOne() → cache hit
      mockRedisService.getCache.mockResolvedValue(recipeData);
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.recipe.update.mockResolvedValue({});
      mockPrismaService.recipe.findUnique.mockResolvedValue(updatedRecipe);
      mockRedisService.delCache.mockResolvedValue(undefined);
    });

    /**
     * Cập nhật scalar fields (title, description...) thành công.
     */
    it('should update scalar fields and return updated recipe', async () => {
      const result = await service.update(mockRecipe.id, mockAuthor.id, {
        title: 'Updated Title',
      });

      expect(result).toEqual(updatedRecipe);
      expect(mockRedisService.delCache).toHaveBeenCalledWith(
        `recipe:${mockRecipe.id}`,
      );
    });

    /**
     * Cập nhật cả ingredients: xóa cũ → upsert từng ingredient mới.
     */
    it('should replace all ingredients when provided', async () => {
      mockIngredientsService.upsertByName.mockResolvedValue({ id: 'ing-1' });
      mockPrismaService.recipeIngredient.deleteMany.mockResolvedValue({});
      mockPrismaService.recipeIngredient.create.mockResolvedValue({});

      await service.update(mockRecipe.id, mockAuthor.id, {
        ingredients: [{ name: 'Tomato', quantity: 2, unit: 'pcs' }],
      });

      expect(
        mockPrismaService.recipeIngredient.deleteMany,
      ).toHaveBeenCalledWith({
        where: { recipe_id: mockRecipe.id },
      });
      expect(mockIngredientsService.upsertByName).toHaveBeenCalledTimes(1);
    });

    /**
     * Cập nhật cả steps: xóa cũ → createMany với steps mới.
     */
    it('should replace all steps when provided', async () => {
      mockPrismaService.step.deleteMany.mockResolvedValue({});
      mockPrismaService.step.createMany.mockResolvedValue({ count: 1 });

      await service.update(mockRecipe.id, mockAuthor.id, {
        steps: [{ order_index: 1, content: 'New step' }],
      });

      expect(mockPrismaService.step.deleteMany).toHaveBeenCalledWith({
        where: { recipe_id: mockRecipe.id },
      });
      expect(mockPrismaService.step.createMany).toHaveBeenCalledTimes(1);
    });

    /**
     * Cập nhật category_slugs: Prisma set categories relation.
     */
    it('should update categories when category_slugs are provided', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { slug: 'dessert' },
      ]);
      const result = await service.update(mockRecipe.id, mockAuthor.id, {
        category_slugs: ['dessert'],
      });

      expect(mockPrismaService.recipe.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: {
              set: [{ slug: 'dessert' }],
            },
          }),
        }),
      );
      expect(result).toEqual(updatedRecipe);
    });

    /**
     * Recipe không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if recipe does not exist', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockAuthor.id, { title: 'X' }),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND));
    });

    /**
     * User không phải author → UnauthorizedException.
     */
    it('should throw UnauthorizedException if user is not the author', async () => {
      await expect(
        service.update(mockRecipe.id, 'other-user-id', { title: 'X' }),
      ).rejects.toThrow(new UnauthorizedException(ErrorMessages.NO_PERMISSION));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: likeRecipe()
  // Toggle like/unlike recipe. Gửi notification khi like.
  // ──────────────────────────────────────────────────────────────────────────
  describe('likeRecipe()', () => {
    beforeEach(() => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockPrismaService.recipe.findUnique.mockResolvedValue({
        author_id: mockAuthor.id,
        title: 'Test Recipe',
      });
      mockNotificationService.createNotification.mockResolvedValue(undefined);
    });

    /**
     * Happy path: user chưa like → tạo like record và gửi notification.
     */
    it('should create like and return is_liked=true', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({});

      const result = await service.likeRecipe(mockUser.id, mockRecipe.id);

      expect(result).toEqual({ is_liked: true });
      expect(mockPrismaService.like.create).toHaveBeenCalledTimes(1);
    });

    /**
     * Gửi LIKE notification đến author khi like.
     */
    it('should send LIKE notification to recipe author', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({});

      await service.likeRecipe(mockUser.id, mockRecipe.id);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: mockAuthor.id,
          senderId: mockUser.id,
          type: NotificationType.LIKE,
          resourceType: NotificationResourceType.RECIPE,
        }),
      );
    });

    /**
     * User đã like → xóa like (unlike) và trả về is_liked=false. Không gửi notification.
     */
    it('should delete like and return is_liked=false (unlike)', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue({
        user_id: mockUser.id,
      });
      mockPrismaService.like.delete.mockResolvedValue({});

      const result = await service.likeRecipe(mockUser.id, mockRecipe.id);

      expect(result).toEqual({ is_liked: false });
      expect(mockPrismaService.like.delete).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    /**
     * User không tồn tại → BadRequestException.
     */
    it('should throw BadRequestException if user does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(
        service.likeRecipe('ghost-id', mockRecipe.id),
      ).rejects.toThrow(new BadRequestException(ErrorMessages.USER_NOT_FOUND));
    });

    /**
     * Recipe không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if recipe does not exist', async () => {
      mockPrismaService.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.likeRecipe(mockUser.id, 'ghost-recipe'),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND));
    });

    /**
     * User cố like recipe của chính mình → BadRequestException: CANNOT_LIKE_OWN_RECIPE.
     */
    it('should throw BadRequestException if user tries to like their own recipe', async () => {
      mockPrismaService.recipe.findUnique.mockResolvedValue({
        author_id: mockUser.id, // same as user
        title: 'My Recipe',
      });
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      await expect(
        service.likeRecipe(mockUser.id, mockRecipe.id),
      ).rejects.toThrow(
        new BadRequestException(ErrorMessages.CANNOT_LIKE_OWN_RECIPE),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 7: getUserRecipes()
  // Lấy tất cả recipe của một user với likes/comments count.
  // ──────────────────────────────────────────────────────────────────────────
  describe('getUserRecipes()', () => {
    /**
     * Trả về danh sách recipe với comments_count và likes_count được map.
     */
    it('should return all recipes for a user with mapped counts', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([
        mockRecipeWithCount,
      ]);

      const result = await service.getUserRecipes(mockAuthor.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('comments_count', 5);
      expect(result[0]).toHaveProperty('likes_count', 10);
      expect(result[0]).not.toHaveProperty('_count');
      expect(mockPrismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { author_id: mockAuthor.id } }),
      );
    });

    /**
     * Không có recipe nào → trả về mảng rỗng.
     */
    it('should return empty array if user has no recipes', async () => {
      mockPrismaService.recipe.findMany.mockResolvedValue([]);

      const result = await service.getUserRecipes(mockAuthor.id);

      expect(result).toEqual([]);
    });
  });
});
