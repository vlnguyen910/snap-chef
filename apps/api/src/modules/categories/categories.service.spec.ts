import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as slugifyUtil from 'src/common/utils/slugify.util';
import { ErrorMessages } from 'src/common/constants';

// Mock generateSlug
jest.mock('src/common/utils/slugify.util', () => ({
  generateSlug: jest.fn(),
}));

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrismaService = {
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCategory = {
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
    is_active: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('should successfully create a new category', async () => {
      const payload = { name: 'Test Category', is_active: true };
      const slug = 'test-category';

      (slugifyUtil.generateSlug as jest.Mock).mockReturnValue(slug);
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        ...mockCategory,
        ...payload,
        slug,
      });

      const result = await service.create(payload);

      expect(slugifyUtil.generateSlug).toHaveBeenCalledWith(payload.name);
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { slug },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: { ...payload, slug },
      });
      expect(result).toEqual({ ...mockCategory, ...payload, slug });
    });

    it('should throw ConflictException if slug already exists', async () => {
      const payload = { name: 'Test Category', is_active: true };
      const slug = 'test-category';

      (slugifyUtil.generateSlug as jest.Mock).mockReturnValue(slug);
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory); // Slug exists

      await expect(service.create(payload)).rejects.toThrow(
        new ConflictException(ErrorMessages.CATEGORY_ALREADY_EXISTS),
      );

      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active categories when isActiveOnly is true (default)', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockCategory]);
    });

    it('should return all categories when isActiveOnly is false', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll(false);

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('update', () => {
    const updatePayload = { is_active: false };
    const updatePayloadWithName = { name: 'Updated Category' };

    it('should throw NotFoundException if category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updatePayload)).rejects.toThrow(
        new NotFoundException(ErrorMessages.CATEGORY_NOT_FOUND),
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should successfully update a category without name payload', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        ...updatePayload,
      });

      const result = await service.update(mockCategory.id, updatePayload);

      expect(slugifyUtil.generateSlug).not.toHaveBeenCalled();
      expect(mockPrismaService.category.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: { ...updatePayload },
      });
      expect(result).toEqual({ ...mockCategory, ...updatePayload });
    });

    it('should successfully update a category with new name and slug', async () => {
      const newSlug = 'updated-category';

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      (slugifyUtil.generateSlug as jest.Mock).mockReturnValue(newSlug);
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        ...updatePayloadWithName,
        slug: newSlug,
      });

      const result = await service.update(
        mockCategory.id,
        updatePayloadWithName,
      );

      expect(slugifyUtil.generateSlug).toHaveBeenCalledWith(
        updatePayloadWithName.name,
      );
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { slug: newSlug, id: { not: mockCategory.id } },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: { ...updatePayloadWithName },
      });
      expect(result).toEqual({
        ...mockCategory,
        ...updatePayloadWithName,
        slug: newSlug,
      });
    });

    it('should successfully update a category with the same name', async () => {
      const updatePayloadSameName = { name: mockCategory.name };
      const sameSlug = mockCategory.slug;

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      (slugifyUtil.generateSlug as jest.Mock).mockReturnValue(sameSlug);
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        ...updatePayloadSameName,
        slug: sameSlug,
      });

      const result = await service.update(
        mockCategory.id,
        updatePayloadSameName,
      );

      expect(slugifyUtil.generateSlug).toHaveBeenCalledWith(
        updatePayloadSameName.name,
      );
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: { slug: sameSlug, id: { not: mockCategory.id } },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: { ...updatePayloadSameName },
      });
      expect(result).toEqual({
        ...mockCategory,
        ...updatePayloadSameName,
        slug: sameSlug,
      });
    });

    it('should throw ConflictException if new name generates a duplicate slug', async () => {
      const newSlug = 'updated-category';

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      (slugifyUtil.generateSlug as jest.Mock).mockReturnValue(newSlug);
      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 2,
        slug: newSlug,
      }); // Slug already used

      await expect(
        service.update(mockCategory.id, updatePayloadWithName),
      ).rejects.toThrow(
        new ConflictException(ErrorMessages.CATEGORY_DUPLICATED),
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });
  });
});
