import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  NotificationType,
  NotificationResourceType,
} from 'src/generated/prisma/enums';
import { ErrorMessages } from 'src/common/constants';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  username: 'testuser',
  email: 'test@example.com',
  avatar_url: null,
  role: 'USER',
};

const mockRecipe = {
  id: 'recipe-uuid-1',
  title: 'Test Recipe',
  author_id: 'author-uuid-1',
};

const mockComment = {
  id: 1,
  user_id: 'user-uuid-1',
  recipe_id: 'recipe-uuid-1',
  content: 'Great recipe!',
  rating: 5,
  created_at: new Date(),
  user: mockUser,
  recipe: mockRecipe,
};

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrismaService = {
  recipe: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  comment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  block: {
    findFirst: jest.fn(),
  },
};

const mockNotificationService = {
  createNotification: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 1: Khởi tạo
  // ──────────────────────────────────────────────────────────────────────────
  describe('initialization', () => {
    /**
     * Xác nhận service được tạo thành công qua DI container.
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 2: create()
  // Tạo comment cho recipe và gửi notification đến author.
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto = { content: 'Great recipe!', rating: 5 };

    beforeEach(() => {
      mockPrismaService.recipe.findUnique.mockResolvedValue(mockRecipe);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);
      mockNotificationService.createNotification.mockResolvedValue(undefined);
    });

    /**
     * Happy path: recipe và user tồn tại → tạo comment → gửi notification → trả về message.
     */
    it('should create comment and return success message', async () => {
      mockPrismaService.block.findFirst.mockResolvedValue(null);
      const result = await service.create(mockUser.id, mockRecipe.id, dto);

      expect(result).toEqual({ message: 'Comment Created' });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          recipe_id: mockRecipe.id,
          content: dto.content,
          rating: dto.rating,
        },
      });
    });

    /**
     * Gửi COMMENT notification đến recipe author sau khi tạo comment.
     */
    it('should send COMMENT notification to recipe author', async () => {
      mockPrismaService.block.findFirst.mockResolvedValue(null);
      await service.create(mockUser.id, mockRecipe.id, dto);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: mockRecipe.author_id,
          senderId: mockUser.id,
          type: NotificationType.COMMENT,
          resourceType: NotificationResourceType.RECIPE,
          resourceId: mockRecipe.id,
        }),
      );
    });

    /**
     * Recipe không tồn tại → NotFoundException trước khi tạo comment.
     */
    it('should throw NotFoundException if recipe does not exist', async () => {
      mockPrismaService.recipe.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockUser.id, 'ghost-recipe', dto),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND));
      expect(mockPrismaService.comment.create).not.toHaveBeenCalled();
    });

    /**
     * Throw Error nếu blocked
     */
    it('should throw NotFoundException if users blocked each other', async () => {
      mockPrismaService.block.findFirst.mockResolvedValue({
        blocker_id: mockUser.id,
        blocked_id: mockRecipe.author_id,
      });

      await expect(
        service.create(mockUser.id, mockRecipe.id, dto),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: findOneById()
  // Lấy một comment theo ID (dùng nội bộ trong delete/update).
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOneById()', () => {
    /**
     * Tìm thấy comment với include user và recipe.
     */
    it('should return a comment with user and recipe included', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.findOneById(1);

      expect(result).toEqual(mockComment);
      expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, recipe: true },
      });
    });

    /**
     * Comment không tồn tại → trả về null (không throw).
     */
    it('should return null when comment is not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      const result = await service.findOneById(999);

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: findAllCommentsOfRecipe()
  // Lấy tất cả comments của một recipe với pagination.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findAllCommentsOfRecipe()', () => {
    const query = { page: 1, limit: 10 };

    /**
     * Trả về danh sách comments với pagination đúng.
     */
    it('should return paginated comments for a recipe', async () => {
      const mockComments = [mockComment, { ...mockComment, id: 2 }];
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findAllCommentsOfRecipe(
        mockRecipe.id,
        query,
      );

      expect(result).toEqual(mockComments);
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipe_id: mockRecipe.id },
          skip: 0,
          take: 10,
        }),
      );
    });

    /**
     * Pagination đúng: page=2, limit=5 → skip=5.
     */
    it('should apply correct skip for pagination', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      await service.findAllCommentsOfRecipe(mockRecipe.id, {
        page: 2,
        limit: 5,
      });

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    /**
     * Không có comment nào → trả về mảng rỗng.
     */
    it('should return empty array when no comments exist', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await service.findAllCommentsOfRecipe(
        mockRecipe.id,
        query,
      );

      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: deleteComment()
  // Xóa comment. Cho phép cả commenter và recipe author xóa.
  // ──────────────────────────────────────────────────────────────────────────
  describe('deleteComment()', () => {
    beforeEach(() => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);
    });

    /**
     * Commenter xóa comment của chính mình → thành công.
     */
    it('should delete comment when called by the commenter', async () => {
      const result = await service.deleteComment(1, mockUser.id);

      expect(result).toEqual({ message: 'Comment deleted' });
      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    /**
     * Recipe author xóa comment của người khác → thành công (moderation right).
     */
    it('should delete comment when called by the recipe author', async () => {
      const result = await service.deleteComment(1, mockRecipe.author_id);

      expect(result).toEqual({ message: 'Comment deleted' });
      expect(mockPrismaService.comment.delete).toHaveBeenCalledTimes(1);
    });

    /**
     * Comment không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.deleteComment(999, mockUser.id)).rejects.toThrow(
        new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND),
      );
    });

    /**
     * User không phải commenter cũng không phải recipe author → UnauthorizedException.
     */
    it('should throw UnauthorizedException if user has no right to delete', async () => {
      await expect(service.deleteComment(1, 'random-user-id')).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.NO_RIGHT_DELETE_COMMENT),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: updateComment()
  // Chỉ commenter mới được sửa comment của mình.
  // ──────────────────────────────────────────────────────────────────────────
  describe('updateComment()', () => {
    const updateDto = { content: 'Updated content', rating: 4 };

    beforeEach(() => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue({
        ...mockComment,
        ...updateDto,
      });
    });

    /**
     * Commenter sửa comment của mình → thành công.
     */
    it('should update comment and return success message', async () => {
      const result = await service.updateComment(1, mockUser.id, updateDto);

      expect(result).toEqual({ message: 'Comment Updated' });
      expect(mockPrismaService.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: updateDto.content, rating: updateDto.rating },
      });
    });

    /**
     * Comment không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateComment(999, mockUser.id, updateDto),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.COMMENT_NOT_FOUND));
    });

    /**
     * User không phải tác giả comment → UnauthorizedException.
     * Khác deleteComment: recipe author KHÔNG được sửa comment của người khác.
     */
    it('should throw UnauthorizedException if user is not the commenter', async () => {
      await expect(
        service.updateComment(1, 'other-user', updateDto),
      ).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.NO_RIGHT_UPDATE_COMMENT),
      );
    });
  });
});
