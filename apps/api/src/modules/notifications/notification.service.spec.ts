import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { WebSocketEvents } from 'src/common/constants';
import {
  NotificationType,
  NotificationResourceType,
} from 'src/generated/prisma/enums';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockNotification = {
  id: 1,
  receiver_id: 'user-uuid-1',
  sender_id: 'user-uuid-2',
  type: NotificationType.LIKE,
  message: 'testuser liked your recipe',
  resource_id: 'recipe-uuid-1',
  resource_type: NotificationResourceType.RECIPE,
  is_read: false,
  created_at: new Date(),
  sender: {
    id: 'user-uuid-2',
    username: 'testuser',
    avatar_url: null,
  },
};

const createDto = {
  receiverId: 'user-uuid-1',
  senderId: 'user-uuid-2',
  type: NotificationType.LIKE,
  message: 'testuser liked your recipe',
  resourceId: 'recipe-uuid-1',
  resourceType: NotificationResourceType.RECIPE,
};

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrismaService = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockNotificationGateway = {
  sendToUser: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    // Suppress NestJS Logger output — error-path tests intentionally trigger
    // Logger.error() inside the service's catch block. We silence it so that
    // expected errors don't pollute the test output.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
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
  // PHẦN 2: createNotification()
  // Tạo notification trong DB và gửi real-time qua WebSocket.
  // ──────────────────────────────────────────────────────────────────────────
  describe('createNotification()', () => {
    beforeEach(() => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);
    });

    /**
     * Happy path: tạo notification trong DB → gửi qua WebSocket → trả về notification.
     */
    it('should create notification in DB and send via WebSocket', async () => {
      const result = await service.createNotification(createDto);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          receiver_id: createDto.receiverId,
          sender_id: createDto.senderId,
          type: createDto.type,
          message: createDto.message,
          resource_id: createDto.resourceId,
          resource_type: createDto.resourceType,
        },
        include: {
          sender: {
            select: { id: true, username: true, avatar_url: true },
          },
        },
      });
    });

    /**
     * Sau khi tạo → gửi real-time event NEW_NOTIFICATION đến receiverId qua Gateway.
     */
    it('should emit NEW_NOTIFICATION event to the receiver via WebSocket gateway', async () => {
      await service.createNotification(createDto);

      expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
        createDto.receiverId,
        WebSocketEvents.NEW_NOTIFICATION,
        mockNotification,
      );
    });

    /**
     * Nếu Prisma throw → service re-throw (không nuốt lỗi).
     */
    it('should propagate error if DB operation fails', async () => {
      mockPrismaService.notification.create.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.createNotification(createDto)).rejects.toThrow(
        'DB Error',
      );
    });

    /**
     * Nếu Prisma throw → WebSocket không được gọi.
     */
    it('should not send WebSocket event if DB operation fails', async () => {
      mockPrismaService.notification.create.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.createNotification(createDto)).rejects.toThrow();
      expect(mockNotificationGateway.sendToUser).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 3: getNotifications()
  // Lấy tất cả notifications của một user, sắp xếp mới nhất trước.
  // ──────────────────────────────────────────────────────────────────────────
  describe('getNotifications()', () => {
    /**
     * Trả về danh sách notifications với sender info, sắp xếp theo created_at desc.
     */
    it('should return notifications for a user ordered by newest first', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([
        mockNotification,
      ]);

      const result = await service.getNotifications('user-uuid-1');

      expect(result).toEqual([mockNotification]);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { receiver_id: 'user-uuid-1' },
        orderBy: { created_at: 'desc' },
        include: {
          sender: { select: { id: true, username: true, avatar_url: true } },
        },
      });
    });

    /**
     * Không có notification nào → trả về mảng rỗng.
     */
    it('should return empty array when user has no notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const result = await service.getNotifications('user-uuid-1');

      expect(result).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 4: markAsRead()
  // Đánh dấu một notification là đã đọc.
  // ──────────────────────────────────────────────────────────────────────────
  describe('markAsRead()', () => {
    /**
     * Đánh dấu đã đọc với đúng userId và notificationId.
     * where.receiver_id đảm bảo user chỉ đọc notification của chính mình.
     */
    it('should mark a specific notification as read', async () => {
      const updated = { ...mockNotification, is_read: true };
      mockPrismaService.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead('user-uuid-1', 1);

      expect(result.is_read).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 1, receiver_id: 'user-uuid-1' },
        data: { is_read: true },
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 5: markAllAsRead()
  // Đánh dấu tất cả notifications chưa đọc là đã đọc.
  // ──────────────────────────────────────────────────────────────────────────
  describe('markAllAsRead()', () => {
    /**
     * updateMany chỉ cập nhật notifications chưa đọc (is_read: false) của user.
     */
    it('should mark all unread notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-uuid-1');

      expect(result).toEqual({ count: 3 });
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { receiver_id: 'user-uuid-1', is_read: false },
        data: { is_read: true },
      });
    });

    /**
     * Không có notification nào chưa đọc → count: 0.
     */
    it('should return count 0 when all notifications are already read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.markAllAsRead('user-uuid-1');

      expect(result).toEqual({ count: 0 });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PHẦN 6: cleanUpOldNotifications() (Cron job)
  // Xóa notifications cũ hơn 30 ngày, chạy mỗi ngày lúc 00:00.
  // ──────────────────────────────────────────────────────────────────────────
  describe('cleanUpOldNotifications()', () => {
    /**
     * Xóa notifications có created_at < (now - 30 days).
     * Kiểm tra filter lte sử dụng Date object.
     */
    it('should delete notifications older than 30 days', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanUpOldNotifications();

      expect(mockPrismaService.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            lte: expect.any(Date) as unknown,
          },
        },
      });
    });

    /**
     * Không có notification cũ → deleteMany không throw.
     */
    it('should not throw when there are no old notifications', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.cleanUpOldNotifications()).resolves.not.toThrow();
    });
  });
});
