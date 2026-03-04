import { Test, TestingModule } from '@nestjs/testing';
import { CollectionService } from './collection.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { UsersService } from '../users/users.service';
import { RecipesService } from '../recipes/recipes.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ErrorMessages } from 'src/common/constants';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockOwner = { id: 'owner-uuid-1', username: 'owner', email: 'owner@example.com' };
const mockOtherUser = { id: 'other-uuid-1', username: 'other', email: 'other@example.com' };

const mockRecipe = {
  id: 'recipe-uuid-1',
  title: 'Test Recipe',
  thumbnail_url: 'https://example.com/thumb.jpg',
};

const mockCollection = {
  id: 'collection-uuid-1',
  name: 'My Favorites',
  description: 'Best recipes',
  is_public: true,
  owner_id: 'owner-uuid-1',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockCollectionWithRecipes = {
  ...mockCollection,
  recipe: [mockRecipe],
};

const mockPrivateCollection = {
  ...mockCollection,
  id: 'collection-uuid-2',
  is_public: false,
};

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrismaService = {
  collection: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockUsersService = {
  findOne: jest.fn(),
};

const mockRecipesService = {
  findOne: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('CollectionService', () => {
  let service: CollectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RecipesService, useValue: mockRecipesService },
      ],
    }).compile();

    service = module.get<CollectionService>(CollectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 1: Khởi tạo
  // ──────────────────────────────────────────────────────────────────────────
  describe('initialization', () => {
    /**
     * Xác nhận service được khởi tạo thành công.
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 2: create()
  // Tạo collection mới cho user.
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto = { name: 'My Favorites', description: 'Best recipes', is_public: true };

    /**
     * Happy path: tạo collection với owner_id được set từ user_id.
     */
    it('should create a collection with the correct owner_id', async () => {
      mockPrismaService.collection.create.mockResolvedValue(mockCollection);

      const result = await service.create(mockOwner.id, dto);

      expect(result).toEqual(mockCollection);
      expect(mockPrismaService.collection.create).toHaveBeenCalledWith({
        data: { ...dto, owner_id: mockOwner.id },
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: getUserCollection()
  // Lấy danh sách collection của một user.
  // Owner xem được cả private collections; người khác chỉ xem được public.
  // ──────────────────────────────────────────────────────────────────────────
  describe('getUserCollection()', () => {
    beforeEach(() => {
      mockUsersService.findOne.mockResolvedValue(mockOwner);
      mockPrismaService.collection.findMany.mockResolvedValue([mockCollection]);
    });

    /**
     * Owner xem danh sách của chính mình → không filter is_public.
     */
    it('should return all collections (including private) when owner views their own', async () => {
      await service.getUserCollection(mockOwner.id, mockOwner.id);

      const call = mockPrismaService.collection.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('is_public');
    });

    /**
     * Người khác xem → chỉ lấy collections có is_public: true.
     */
    it('should return only public collections when viewed by another user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockOwner);

      await service.getUserCollection(mockOwner.id, mockOtherUser.id);

      const call = mockPrismaService.collection.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('is_public', true);
    });

    /**
     * Không đăng nhập → chỉ lấy public collections.
     */
    it('should return only public collections when not logged in', async () => {
      await service.getUserCollection(mockOwner.id, undefined);

      const call = mockPrismaService.collection.findMany.mock.calls[0][0];
      expect(call.where).toHaveProperty('is_public', true);
    });

    /**
     * Owner không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if owner does not exist', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.getUserCollection('ghost-id', null)).rejects.toThrow(
        new NotFoundException(ErrorMessages.USER_NOT_FOUND),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: findOne()
  // Lấy chi tiết collection theo ID, bao gồm danh sách recipe.
  // Kiểm tra quyền xem private collection.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    /**
     * Public collection → bất kỳ ai cũng xem được.
     */
    it('should return public collection for any user', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue(mockCollectionWithRecipes);

      const result = await service.findOne(mockCollection.id, mockOtherUser.id);

      expect(result).toEqual(mockCollectionWithRecipes);
    });

    /**
     * Private collection, user là owner → được xem.
     */
    it('should return private collection when accessed by the owner', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue({
        ...mockPrivateCollection,
        recipe: [],
      });

      const result = await service.findOne(mockPrivateCollection.id, mockOwner.id);

      expect(result.is_public).toBe(false);
    });

    /**
     * Private collection, user không phải owner → ForbiddenException.
     */
    it('should throw ForbiddenException if user tries to access private collection', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue({
        ...mockPrivateCollection,
        recipe: [],
      });

      await expect(service.findOne(mockPrivateCollection.id, mockOtherUser.id)).rejects.toThrow(
        new ForbiddenException(ErrorMessages.COLLECTION_FORBIDDEN),
      );
    });

    /**
     * Collection không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if collection does not exist', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('ghost-id', mockOwner.id)).rejects.toThrow(
        new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: addRecipe()
  // Toggle recipe vào/ra collection (add nếu chưa có, remove nếu đã có).
  // ──────────────────────────────────────────────────────────────────────────
  describe('addRecipe()', () => {
    beforeEach(() => {
      mockRecipesService.findOne.mockResolvedValue({ ...mockRecipe, is_liked: false });
      mockPrismaService.collection.update.mockResolvedValue({});
    });

    /**
     * Recipe chưa có trong collection → add (connect) và trả về message "added to".
     */
    it('should add recipe to collection and return success message', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        recipe: [], // Recipe chưa có
      });

      const result = await service.addRecipe(mockCollection.id, mockRecipe.id, mockOwner.id);

      expect(result.message).toContain('added to');
      expect(mockPrismaService.collection.update).toHaveBeenCalledWith({
        where: { id: mockCollection.id },
        data: { recipe: { connect: { id: mockRecipe.id } } },
      });
    });

    /**
     * Recipe đã có trong collection → remove (disconnect) và trả về message "removed from".
     */
    it('should remove recipe from collection and return success message', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        recipe: [{ id: mockRecipe.id }], // Recipe đã có
      });

      const result = await service.addRecipe(mockCollection.id, mockRecipe.id, mockOwner.id);

      expect(result.message).toContain('removed from');
      expect(mockPrismaService.collection.update).toHaveBeenCalledWith({
        where: { id: mockCollection.id },
        data: { recipe: { disconnect: { id: mockRecipe.id } } },
      });
    });

    /**
     * Recipe không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if recipe does not exist', async () => {
      mockRecipesService.findOne.mockRejectedValue(
        new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND),
      );

      await expect(
        service.addRecipe(mockCollection.id, 'ghost-recipe', mockOwner.id),
      ).rejects.toThrow(NotFoundException);
    });

    /**
     * Collection không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if collection does not exist', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.addRecipe('ghost-collection', mockRecipe.id, mockOwner.id),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND));
    });

    /**
     * User không phải owner → ForbiddenException (không được sửa collection của người khác).
     */
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        recipe: [],
      });

      await expect(
        service.addRecipe(mockCollection.id, mockRecipe.id, mockOtherUser.id),
      ).rejects.toThrow(new ForbiddenException(ErrorMessages.NO_RIGHT_EDIT_COLLECTION));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: update()
  // Cập nhật thông tin collection. Chỉ owner mới được sửa.
  // ──────────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    const updateDto = { name: 'Updated Name', is_public: false };

    beforeEach(() => {
      // findOne() → public collection, owner là mockOwner
      mockPrismaService.collection.findUnique.mockResolvedValue(mockCollectionWithRecipes);
    });

    /**
     * Owner cập nhật collection của mình → thành công.
     */
    it('should update collection and return updated data', async () => {
      const updatedCollection = { ...mockCollection, ...updateDto };
      mockPrismaService.collection.update.mockResolvedValue(updatedCollection);

      const result = await service.update(mockCollection.id, updateDto, mockOwner.id);

      expect(result).toEqual(updatedCollection);
      expect(mockPrismaService.collection.update).toHaveBeenCalledWith({
        where: { id: mockCollection.id },
        data: updateDto,
      });
    });

    /**
     * User không phải owner → ForbiddenException từ findOne() vì collection là của người khác.
     */
    it('should throw ForbiddenException if user is not the owner', async () => {
      await expect(
        service.update(mockCollection.id, updateDto, mockOtherUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    /**
     * Collection không tồn tại → NotFoundException từ findOne().
     */
    it('should throw NotFoundException if collection does not exist', async () => {
      mockPrismaService.collection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('ghost-id', updateDto, mockOwner.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
