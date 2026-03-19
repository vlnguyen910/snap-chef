import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../common/db/prisma.service';
import { RecipeStatus } from 'src/generated/prisma/enums';

describe('FeedService', () => {
  let service: FeedService;
  let prismaService: PrismaService;

  const makeRecipe = (id: string) => ({
    id,
    title: `Recipe ${id}`,
    cooking_time: 20,
    thumbnail_url: 'https://example.com/recipe.jpg',
    created_at: new Date('2026-03-19T00:00:00.000Z'),
    user: {
      id: 'user-1',
      username: 'chef',
      avatar_url: null,
    },
    _count: {
      likes: 5,
      comments: 2,
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: PrismaService,
          useValue: {
            recipe: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            comment: {
              groupBy: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserFeed', () => {
    it('should call getTrendingRecipes if userId is not provided', async () => {
      const getTrendingRecipesSpy = jest
        .spyOn(service, 'getTrendingRecipes')
        .mockResolvedValue({ data: [], nextCursor: null } as any);

      await service.getUserFeed(undefined, undefined, 10);
      expect(getTrendingRecipesSpy).toHaveBeenCalledWith(10, undefined);
    });

    it('should return user feed and nextCursor if enough recipes exist', async () => {
      // Create 11 mock recipes to test cursor logic taking limit + 1
      const mockRecipes = Array(11)
        .fill(null)
        .map((_, i) => makeRecipe(`recipe-${i}`));
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);
      jest
        .spyOn(prismaService.comment, 'groupBy')
        .mockResolvedValue([] as any);

      const result = await service.getUserFeed('user-1', undefined, 10);

      expect(prismaService.recipe.findMany).toHaveBeenCalledTimes(1);
      expect(result.data.length).toBe(10);
      expect(result.nextCursor).toBe('recipe-10'); // After pop, the 11th item's id is the cursor
    });

    it('should handle skip correctly when cursor is provided', async () => {
      const mockRecipes = [makeRecipe('recipe-2')];
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);
      jest
        .spyOn(prismaService.recipe, 'findFirst')
        .mockResolvedValue({ id: 'trending-1' } as any);
      jest
        .spyOn(prismaService.comment, 'groupBy')
        .mockResolvedValue([] as any);

      const getTrendingSpy = jest.spyOn(service, 'getTrendingRecipes');

      const result = await service.getUserFeed('user-1', 'recipe-1', 10);

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: 'recipe-1' },
          take: 11,
        }),
      );

      // Should not call getTrendingRecipes because cursor is provided
      expect(getTrendingSpy).not.toHaveBeenCalled();
      expect(result.data.length).toBe(1);
      expect(result.nextCursor).toBe('trending:');
    });

    it('should fallback to trending if user feed is empty and no cursor exists', async () => {
      jest.spyOn(prismaService.recipe, 'findMany').mockResolvedValue([]);
      const getTrendingRecipesSpy = jest
        .spyOn(service, 'getTrendingRecipes')
        .mockResolvedValue({ data: [], nextCursor: null } as any);

      await service.getUserFeed('user-1', undefined, 10);

      expect(getTrendingRecipesSpy).toHaveBeenCalledWith(10, undefined, 'user-1');
    });

    it('should continue with trending feed when cursor is trending-prefixed', async () => {
      const getTrendingRecipesSpy = jest
        .spyOn(service, 'getTrendingRecipes')
        .mockResolvedValue({ data: [], nextCursor: null } as any);

      await service.getUserFeed('user-1', 'trending:recipe-99', 10);

      expect(getTrendingRecipesSpy).toHaveBeenCalledWith(
        10,
        'trending:recipe-99',
        'user-1',
      );
    });
  });

  describe('getTrendingRecipes', () => {
    it('should return trending recipes and nextCursor correctly', async () => {
      const mockRecipes = Array(11)
        .fill(null)
        .map((_, i) => makeRecipe(`trending-${i}`));
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);
      jest
        .spyOn(prismaService.comment, 'groupBy')
        .mockResolvedValue([] as any);

      const result = await service.getTrendingRecipes(10);

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 11,
          skip: 0,
          where: {
            status: RecipeStatus.PUBLISHED,
            deleted_at: null,
          },
          orderBy: expect.any(Array),
        }),
      );
      expect(result.data.length).toBe(10);
      expect(result.nextCursor).toBe('trending:trending-10');
    });

    it('should apply cursor correctly for trending-prefixed cursor', async () => {
      const mockRecipes = [makeRecipe('trending-2')];
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);
      jest
        .spyOn(prismaService.comment, 'groupBy')
        .mockResolvedValue([] as any);

      await service.getTrendingRecipes(10, 'trending:trending-1');

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: 'trending-1' },
          take: 11,
        }),
      );
    });

    it('should exclude followed authors in trending fallback for logged-in users', async () => {
      jest.spyOn(prismaService.recipe, 'findMany').mockResolvedValue([] as any);
      jest
        .spyOn(prismaService.comment, 'groupBy')
        .mockResolvedValue([] as any);

      await service.getTrendingRecipes(10, undefined, 'user-1');

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: RecipeStatus.PUBLISHED,
            deleted_at: null,
            user: {
              followedBy: {
                none: {
                  follower_id: 'user-1',
                },
              },
            },
          },
        }),
      );
    });
  });
});
