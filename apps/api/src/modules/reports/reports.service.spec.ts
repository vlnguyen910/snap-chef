import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  TargetReportType,
  ReportReason,
  ReportStatus,
  UserRoles,
} from 'src/generated/prisma/enums';
import { NotFoundException } from '@nestjs/common';
import { ErrorMessages } from 'src/common/constants';

/**
 * Mock report data — handler_id là null vì mới tạo chưa có admin xử lý.
 */
const mockReport = {
  id: 'report-uuid-1',
  reporter_id: 'user-uuid-1',
  target_type: TargetReportType.RECIPE,
  target_id: 'recipe-uuid-1',
  reason: ReportReason.SPAM,
  description: 'This is spam content',
  status: ReportStatus.PENDING,
  handler_id: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockUser = {
  id: 'user-uuid-1',
  email: 'user@example.com',
  username: 'testuser',
  role: UserRoles.USER,
};

const mockAdmin = {
  id: 'admin-uuid-1',
  role: UserRoles.ADMIN,
};

/**
 * Mock PrismaService: Thay vì kết nối DB thật, dùng jest.fn().
 *
 * Cách thêm mock mới:
 * - Tìm method bạn muốn mock (vd: prisma.report.delete)
 * - Thêm vào mockPrismaService.report bên dưới
 */
const mockPrismaService = {
  report: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

/**
 * Mock NotificationService — service.create() gọi để gửi noti đến admin.
 */
const mockNotificationService = {
  createNotification: jest.fn(),
};

/**
 * Mock UsersService — service.create() gọi để xác nhận reporter tồn tại.
 */
const mockUsersService = {
  findOne: jest.fn(),
};

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // PHẦN 1: Khởi tạo service
  // ─────────────────────────────────────────────
  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 2: create()
  // ─────────────────────────────────────────────
  describe('create()', () => {
    /**
     * CreateReportDto không chứa reporter_id, handler_id, status.
     * reporter_id được truyền riêng từ user token.
     */
    const createDto: CreateReportDto = {
      target_type: TargetReportType.RECIPE,
      target_id: 'recipe-uuid-1',
      reason: ReportReason.SPAM,
      description: 'Spam content',
    };

    const reporterId = 'user-uuid-1';

    beforeEach(() => {
      // Setup mặc định: user tồn tại, không có admin
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockNotificationService.createNotification.mockResolvedValue(undefined);
    });

    it('should create and return a report', async () => {
      prisma.report.create.mockResolvedValue(mockReport);

      const result = await service.create(reporterId, createDto);

      expect(result).toEqual(mockReport);
      expect(prisma.report.create).toHaveBeenCalledTimes(1);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: { reporter_id: reporterId, ...createDto },
      });
    });

    it('should throw NotFoundException if reporter does not exist', async () => {
      // User không tồn tại
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.create(reporterId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should send notifications to all admins after creating report', async () => {
      prisma.report.create.mockResolvedValue(mockReport);
      mockPrismaService.user.findMany.mockResolvedValue([mockAdmin]);

      await service.create(reporterId, createDto);

      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: reporterId,
          receiverId: mockAdmin.id,
        }),
      );
    });

    it('should not send notifications if no admins exist', async () => {
      prisma.report.create.mockResolvedValue(mockReport);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.create(reporterId, createDto);

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should create report without optional description', async () => {
      const dtoWithoutDescription: CreateReportDto = {
        target_type: TargetReportType.USER,
        target_id: 'user-uuid-3',
        reason: ReportReason.FAKE_ACCOUNT,
      };
      const expectedReport = { ...mockReport, description: undefined };
      prisma.report.create.mockResolvedValue(expectedReport);

      const result = await service.create(reporterId, dtoWithoutDescription);

      expect(result).toEqual(expectedReport);
    });

    it('should propagate error if prisma throws', async () => {
      prisma.report.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(reporterId, createDto)).rejects.toThrow(
        'DB Error',
      );
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 3: findAll()
  // ─────────────────────────────────────────────
  describe('findAll()', () => {
    it('should return an array of reports', async () => {
      const mockReports = [mockReport, { ...mockReport, id: 'report-uuid-2' }];
      prisma.report.findMany.mockResolvedValue(mockReports);

      const result = await service.findAll();

      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
      expect(prisma.report.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no reports exist', async () => {
      prisma.report.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate error if prisma throws', async () => {
      prisma.report.findMany.mockRejectedValue(new Error('Connection failed'));

      await expect(service.findAll()).rejects.toThrow('Connection failed');
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 4: findOne()
  // ─────────────────────────────────────────────
  describe('findOne()', () => {
    it('should return a report when found', async () => {
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.findOne('report-uuid-1');

      expect(result).toEqual(mockReport);
      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-uuid-1' },
      });
    });

    it('should return null when report is not found', async () => {
      prisma.report.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });

    it('should pass the correct id to prisma', async () => {
      prisma.report.findUnique.mockResolvedValue(mockReport);

      const testId = 'specific-uuid-999';
      await service.findOne(testId);

      expect(prisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: testId },
      });
    });

    it('should propagate error if prisma throws', async () => {
      prisma.report.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(service.findOne('some-id')).rejects.toThrow('DB Error');
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 5: update()
  // Admin cập nhật status và/hoặc assign handler_id
  // ─────────────────────────────────────────────
  describe('update()', () => {
    /**
     * UpdateReportDto chỉ có status và handler_id.
     * Dùng cho admin resolve hoặc dismiss một report.
     */
    const updateDto: UpdateReportDto = {
      status: ReportStatus.RESOLVED,
      handler_id: 'admin-uuid-1',
    };

    const updatedReport = {
      ...mockReport,
      status: ReportStatus.RESOLVED,
      handler_id: 'admin-uuid-1',
    };

    beforeEach(() => {
      // Mock findOne() inside update()
      prisma.report.findUnique.mockResolvedValue(mockReport);
      prisma.user.findUnique.mockResolvedValue(mockAdmin);
    });

    it('should update and return the updated report', async () => {
      prisma.report.update.mockResolvedValue(updatedReport);

      const result = await service.update('report-uuid-1', updateDto);

      expect(result).toEqual(updatedReport);
      expect(result.status).toBe(ReportStatus.RESOLVED);
      expect(result.handler_id).toBe('admin-uuid-1');
      expect(prisma.report.update).toHaveBeenCalledTimes(1);
    });

    it('should call prisma.update with correct id and payload', async () => {
      prisma.report.update.mockResolvedValue(updatedReport);

      await service.update('report-uuid-1', updateDto);

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-uuid-1' },
        data: { ...updateDto },
      });
    });

    it('should update only status (without handler_id)', async () => {
      const statusOnlyDto: UpdateReportDto = { status: ReportStatus.DISMISSED };
      const dismissedReport = { ...mockReport, status: ReportStatus.DISMISSED };
      prisma.report.update.mockResolvedValue(dismissedReport);

      const result = await service.update('report-uuid-1', statusOnlyDto);

      expect(result.status).toBe(ReportStatus.DISMISSED);
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-uuid-1' },
        data: { status: ReportStatus.DISMISSED },
      });
    });

    it('should update only handler_id (without status)', async () => {
      const handlerOnlyDto: UpdateReportDto = { handler_id: 'admin-uuid-2' };
      const assignedReport = { ...mockReport, handler_id: 'admin-uuid-2' };
      prisma.report.update.mockResolvedValue(assignedReport);

      const result = await service.update('report-uuid-1', handlerOnlyDto);

      expect(result.handler_id).toBe('admin-uuid-2');
    });

    it('should throw NotFoundException if report is not found', async () => {
      prisma.report.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(new NotFoundException(ErrorMessages.REPORT_NOT_FOUND));
    });
  });
});
