import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { RedisService } from 'src/common/redis/redis.service';
import { NotificationService } from '../notifications/notification.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  NotificationType,
  NotificationResourceType,
  UserRoles,
} from 'src/generated/prisma/client';
import { ErrorMessages } from 'src/common/constants';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed-password',
  avatar_url: 'https://example.com/avatar.jpg',
  is_active: true,
  is_verified: true,
  role: UserRoles.USER,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockUser2 = {
  ...mockUser,
  id: 'user-uuid-2',
  email: 'other@example.com',
  username: 'otheruser',
};

// ─── Mock Dependencies ────────────────────────────────────────────────────────
const mockPrismaService = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  follow: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  like: {
    findMany: jest.fn(),
  },
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
describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 1: Khởi tạo
  // ──────────────────────────────────────────────────────────────────────────
  describe('initialization', () => {
    /**
     * Kiểm tra NestJS inject đầy đủ dependencies và tạo được service.
     */
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 2: create()
  // Tạo user mới trong database.
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    /**
     * Happy path: prisma tạo user thành công và return user.
     */
    it('should create and return a new user', async () => {
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const payload = {
        email: mockUser.email,
        username: mockUser.username,
        password: mockUser.password,
        avatar_url: mockUser.avatar_url,
        role: UserRoles.USER,
      };

      const result = await service.create(payload);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: { ...payload },
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: findOne()
  // Tìm user theo ID, ưu tiên dùng Redis cache.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    /**
     * Cache hit: Redis trả về user → không cần query DB.
     */
    it('should return cached user without hitting the database', async () => {
      mockRedisService.getCache.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    /**
     * Cache miss: Redis trả về null → query DB → lưu vào cache.
     */
    it('should fetch from DB and cache user when cache is empty', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockRedisService.setCache.mockResolvedValue(undefined);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockRedisService.setCache).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        mockUser,
        60,
      );
    });

    /**
     * User không tồn tại: DB trả về null → cache null → return null.
     */
    it('should return null if user does not exist', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: findByEmail()
  // Tìm user theo email (dùng trong auth).
  // ──────────────────────────────────────────────────────────────────────────
  describe('findByEmail()', () => {
    /**
     * Tìm thấy user theo email.
     */
    it('should return user when found by email', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    /**
     * Không tìm thấy user với email đó.
     */
    it('should return null when user is not found by email', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByEmail('ghost@example.com');

      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: update()
  // Cập nhật thông tin user. Có kiểm tra quyền sở hữu.
  // ──────────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    const updatePayload = { username: 'updated-username' };

    beforeEach(() => {
      mockRedisService.getCache.mockResolvedValue(mockUser); // findOne() cache hit
      mockRedisService.delCache.mockResolvedValue(undefined);
    });

    /**
     * Happy path: user tồn tại và user_id khớp → cập nhật thành công và xóa cache.
     */
    it('should update user and clear cache', async () => {
      const updatedUser = { ...mockUser, username: 'updated-username' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(
        mockUser.id,
        mockUser.id,
        updatePayload,
      );

      expect(result).toEqual(updatedUser);
      expect(mockRedisService.delCache).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { ...updatePayload },
      });
    });

    /**
     * User không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if user does not exist', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'non-existent', updatePayload),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.USER_NOT_FOUND));
    });

    /**
     * user_id không match id trong payload → UnauthorizedException.
     * Ngăn user A cập nhật thông tin của user B.
     */
    it('should throw UnauthorizedException if user_id does not match', async () => {
      await expect(
        service.update(mockUser.id, 'different-user-id', updatePayload),
      ).rejects.toThrow(new UnauthorizedException(ErrorMessages.NO_PERMISSION));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: followUser()
  // Toggle follow/unfollow user. Gửi notification khi follow.
  // ──────────────────────────────────────────────────────────────────────────
  describe('followUser()', () => {
    beforeEach(() => {
      // findOne() cho cả 2 user
      mockRedisService.getCache
        .mockResolvedValueOnce(mockUser) // currentUser
        .mockResolvedValueOnce(mockUser2); // followingUser
      mockNotificationService.createNotification.mockResolvedValue(undefined);
    });

    /**
     * Chưa follow → tạo follow record và trả về message "followed".
     */
    it('should create follow relation and return followed message', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue({});

      const result = await service.followUser(mockUser.id, mockUser2.id);

      expect(result.message).toBe('You have followed this user');
      expect(mockPrismaService.follow.create).toHaveBeenCalledTimes(1);
    });

    /**
     * Đã follow → xóa follow record và trả về message "unfollowed".
     */
    it('should delete follow relation and return unfollowed message', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue({
        follower_id: mockUser.id,
        following_id: mockUser2.id,
      });
      mockPrismaService.follow.delete.mockResolvedValue({});

      const result = await service.followUser(mockUser.id, mockUser2.id);

      expect(result.message).toBe('You have unfollowed this user');
      expect(mockPrismaService.follow.delete).toHaveBeenCalledTimes(1);
    });

    /**
     * Gửi notification FOLLOW đến user được follow.
     */
    it('should create a FOLLOW notification', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue({});

      await service.followUser(mockUser.id, mockUser2.id);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: mockUser2.id,
          senderId: mockUser.id,
          type: NotificationType.FOLLOW,
          resourceType: NotificationResourceType.USER,
        }),
      );
    });

    /**
     * Một trong hai user không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if either user is not found', async () => {
      mockRedisService.getCache.mockReset();
      mockRedisService.getCache
        .mockResolvedValueOnce(null) // currentUser không tìm thấy
        .mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.followUser('ghost-id', mockUser2.id),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.USER_NOT_FOUND));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 7: getLikedRecipes()
  // Lấy danh sách recipe user đã like.
  // ──────────────────────────────────────────────────────────────────────────
  describe('getLikedRecipes()', () => {
    beforeEach(() => {
      mockRedisService.getCache.mockResolvedValue(mockUser); // findOne() cache hit
    });

    /**
     * Happy path: trả về danh sách recipe objects.
     */
    it('should return liked recipes for the user', async () => {
      const mockLikes = [
        { recipe: { id: 'recipe-1', title: 'Pasta' } },
        { recipe: { id: 'recipe-2', title: 'Pizza' } },
      ];
      mockPrismaService.like.findMany.mockResolvedValue(mockLikes);

      const result = await service.getLikedRecipes(mockUser.id);

      expect(result).toEqual(mockLikes);
      expect(mockPrismaService.like.findMany).toHaveBeenCalledWith({
        where: { user_id: mockUser.id },
        select: { recipe: true },
      });
    });

    /**
     * User không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if user is not found', async () => {
      mockRedisService.getCache.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getLikedRecipes('ghost-id')).rejects.toThrow(
        new NotFoundException(ErrorMessages.USER_NOT_FOUND),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 8: getCurrentProfile()
  // Lấy profile đầy đủ của user đang đăng nhập (bao gồm followers/following count).
  // ──────────────────────────────────────────────────────────────────────────
  describe('getCurrentProfile()', () => {
    const mockUserWithCount = {
      ...mockUser,
      _count: { followedBy: 10, following: 5, recipe: 3 },
    };

    /**
     * Happy path: trả về profile đầy đủ với count.
     * Password bị loại khỏi response.
     */
    it('should return profile with counts and without password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithCount);

      const result = await service.getCurrentProfile(mockUser.id);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('_count');
      expect(result.followers_count).toBe(10);
      expect(result.following_count).toBe(5);
      expect(result.recipes_count).toBe(3);
    });

    /**
     * User không tồn tại → NotFoundException.
     */
    it('should throw NotFoundException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentProfile('ghost-id')).rejects.toThrow(
        new NotFoundException(ErrorMessages.USER_NOT_FOUND),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 9: getPublicProfile()
  // Lấy profile public của một user. Bao gồm is_followed status.
  // ──────────────────────────────────────────────────────────────────────────
  describe('getPublicProfile()', () => {
    const mockUserWithCount = {
      ...mockUser,
      _count: { followedBy: 10, following: 5, recipe: 3 },
    };

    beforeEach(() => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithCount);
    });

    /**
     * Đang follow target → is_followed = true.
     */
    it('should return is_followed=true if current user follows target', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue({
        follower_id: mockUser2.id,
        following_id: mockUser.id,
      });

      const result = await service.getPublicProfile(mockUser.id, mockUser2.id);

      expect(result.is_followed).toBe(true);
      expect(result.user).not.toHaveProperty('email');
      expect(result.user).not.toHaveProperty('role');
    });

    /**
     * Không follow target hoặc không đăng nhập → is_followed = false.
     */
    it('should return is_followed=false if not following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);

      const result = await service.getPublicProfile(mockUser.id, mockUser2.id);

      expect(result.is_followed).toBe(false);
    });

    /**
     * Xem profile mà không đăng nhập (current_id = undefined) → is_followed = false.
     */
    it('should return is_followed=false when not logged in', async () => {
      const result = await service.getPublicProfile(mockUser.id, undefined);

      expect(result.is_followed).toBe(false);
      expect(mockPrismaService.follow.findUnique).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 10: findAll()
  // Lấy danh sách user với pagination và search.
  // ──────────────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    const query: UserPaginationDto = { page: 1, limit: 10 };

    /**
     * Trả về danh sách users không bao gồm current user.
     */
    it('should return list of users excluding current user', async () => {
      const mockUsers = [
        { id: 'user-2', username: 'user2', avatar_url: '' },
        { id: 'user-3', username: 'user3', avatar_url: '' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(query, mockUser.id);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: mockUser.id },
          }) as unknown,
        }) as unknown,
      );
    });

    /**
     * Không đăng nhập: không exclude user nào (current_user_id = undefined).
     */
    it('should not exclude any user if not logged in', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.findAll(query, undefined);

      const mockCalls = mockPrismaService.user.findMany.mock.calls;
      const firstCall = mockCalls[0] as unknown[];
      const callArgs = firstCall[0] as {
        where: { id?: unknown };
      };
      expect(callArgs.where.id).toBeUndefined();
    });
  });
});
