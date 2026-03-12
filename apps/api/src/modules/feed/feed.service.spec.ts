import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../common/db/prisma.service';
import { RecipeStatus } from 'src/generated/prisma/enums';

describe('FeedService', () => {
  let service: FeedService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: PrismaService,
          useValue: {
            recipe: {
              findMany: jest.fn(),
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
      expect(getTrendingRecipesSpy).toHaveBeenCalledWith(10);
    });

    it('should return user feed and nextCursor if enough recipes exist', async () => {
      // Create 11 mock recipes to test cursor logic taking limit + 1
      const mockRecipes = Array(11)
        .fill(null)
        .map((_, i) => ({ id: `recipe-${i}` }));
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);

      const result = await service.getUserFeed('user-1', undefined, 10);

      expect(prismaService.recipe.findMany).toHaveBeenCalledTimes(1);
      expect(result.data.length).toBe(10);
      expect(result.nextCursor).toBe('recipe-10'); // After pop, the 11th item's id is the cursor
    });

    it('should handle skip correctly when cursor is provided', async () => {
      const mockRecipes = [{ id: 'recipe-2' }];
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);

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
      expect(result.data).toEqual(mockRecipes);
      expect(result.nextCursor).toBeNull();
    });

    it('should fallback to trending if user feed is empty and no cursor exists', async () => {
      jest.spyOn(prismaService.recipe, 'findMany').mockResolvedValue([]);
      const getTrendingRecipesSpy = jest
        .spyOn(service, 'getTrendingRecipes')
        .mockResolvedValue({ data: [], nextCursor: null } as any);

      await service.getUserFeed('user-1', undefined, 10);

      expect(getTrendingRecipesSpy).toHaveBeenCalledWith(10);
    });
  });

  describe('getTrendingRecipes', () => {
    it('should return trending recipes correctly', async () => {
      const mockRecipes = [{ id: 'trending-1' }];
      jest
        .spyOn(prismaService.recipe, 'findMany')
        .mockResolvedValue(mockRecipes as any);

      const result = await service.getTrendingRecipes(10);
      console.log('Trending Recipes Result:', result);

      expect(prismaService.recipe.findMany).toHaveBeenCalledWith({
        take: 10,
        where: {
          status: RecipeStatus.PUBLISHED,
          deleted_at: null,
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result.data).toEqual(mockRecipes);
      expect(result.nextCursor).toBeNull();
    });
  });
});
