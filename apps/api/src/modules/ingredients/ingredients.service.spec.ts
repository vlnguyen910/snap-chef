import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockIngredient = {
  id: 'ingredient-uuid-1',
  name: 'tomato',
  created_at: new Date(),
};

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrismaService = {
  ingredient: {
    create: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
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
  // Tạo ingredient mới. Normalize tên về lowercase.
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    /**
     * Tên được trim() và toLowerCase() trước khi lưu vào DB.
     */
    it('should create ingredient with trimmed and lowercased name', async () => {
      mockPrismaService.ingredient.create.mockResolvedValue(mockIngredient);

      const result = await service.create({ name: '  Tomato  ' });

      expect(result).toEqual(mockIngredient);
      expect(mockPrismaService.ingredient.create).toHaveBeenCalledWith({
        data: { name: 'tomato' },
      });
    });

    /**
     * Tên chỉ có chữ thường → không thay đổi.
     */
    it('should normalize uppercase names to lowercase', async () => {
      mockPrismaService.ingredient.create.mockResolvedValue({
        ...mockIngredient,
        name: 'basil',
      });

      await service.create({ name: 'BASIL' });

      expect(mockPrismaService.ingredient.create).toHaveBeenCalledWith({
        data: { name: 'basil' },
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: findOneByName()
  // Tìm ingredient theo tên chính xác.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOneByName()', () => {
    /**
     * Tìm thấy ingredient theo tên.
     */
    it('should return ingredient when found by name', async () => {
      mockPrismaService.ingredient.findFirst.mockResolvedValue(mockIngredient);

      const result = await service.findOneByName('tomato');

      expect(result).toEqual(mockIngredient);
      expect(mockPrismaService.ingredient.findFirst).toHaveBeenCalledWith({
        where: { name: 'tomato' },
      });
    });

    /**
     * Không tìm thấy → trả về null.
     */
    it('should return null when ingredient is not found', async () => {
      mockPrismaService.ingredient.findFirst.mockResolvedValue(null);

      const result = await service.findOneByName('saffron');

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: upsertByName()
  // Tìm hoặc tạo ingredient theo tên. Normalize tên về lowercase.
  // Được dùng trong RecipesService khi tạo/cập nhật recipe.
  // ──────────────────────────────────────────────────────────────────────────
  describe('upsertByName()', () => {
    /**
     * Happy path: upsert với tên đã được normalize.
     * Nếu tên đã tồn tại → return ingredient cũ (update: {}).
     * Nếu chưa tồn tại → tạo mới (create: { name }).
     */
    it('should upsert ingredient with normalized name', async () => {
      mockPrismaService.ingredient.upsert.mockResolvedValue(mockIngredient);

      const result = await service.upsertByName('  Tomato  ');

      expect(result).toEqual(mockIngredient);
      expect(mockPrismaService.ingredient.upsert).toHaveBeenCalledWith({
        where: { name: 'tomato' },
        update: {},
        create: { name: 'tomato' },
      });
    });

    /**
     * Khi chạy trong Prisma transaction: dùng `tx` thay vì `this.prisma`.
     * Kiểm tra service truyền client đúng.
     */
    it('should use the provided transaction client when tx is passed', async () => {
      const mockTx = {
        ingredient: {
          upsert: jest.fn().mockResolvedValue(mockIngredient),
        },
      };

      const result = await service.upsertByName(
        'garlic',
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(result).toEqual(mockIngredient);
      // Phải dùng tx.ingredient.upsert, không phải this.prisma.ingredient.upsert
      expect(mockTx.ingredient.upsert).toHaveBeenCalledWith({
        where: { name: 'garlic' },
        update: {},
        create: { name: 'garlic' },
      });
      expect(mockPrismaService.ingredient.upsert).not.toHaveBeenCalled();
    });

    /**
     * Khi không có tx → dùng this.prisma trực tiếp.
     */
    it('should use this.prisma when no transaction client is provided', async () => {
      mockPrismaService.ingredient.upsert.mockResolvedValue(mockIngredient);

      await service.upsertByName('pepper');

      expect(mockPrismaService.ingredient.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
