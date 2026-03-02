import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  TargetReportType,
  ReportReason,
  ReportStatus,
} from 'src/generated/prisma/enums';

/**
 * Mock data dùng chung trong các test case.
 * Bạn có thể thêm nhiều mock object hơn ở đây để test các tình huống khác.
 */
const mockReport = {
  id: 'report-uuid-1',
  reporter_id: 'user-uuid-1',
  target_type: TargetReportType.RECIPE,
  target_id: 'recipe-uuid-1',
  reason: ReportReason.SPAM,
  description: 'This is spam content',
  status: ReportStatus.PENDING,
  handler_id: 'admin-uuid-1',
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Mock PrismaService: Thay vì kết nối DB thật, chúng ta tạo
 * các hàm giả (jest.fn()) để kiểm soát dữ liệu trả về.
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
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get(PrismaService);
  });

  // Reset tất cả mock sau mỗi test để không bị ảnh hưởng chéo
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
  // Kiểm tra việc tạo một report mới
  // ─────────────────────────────────────────────
  describe('create()', () => {
    /**
     * DTO hợp lệ để tạo report.
     * Để thêm test case mới: tạo một dto khác (vd: thiếu field, sai enum)
     * rồi mock prisma.report.create trả về giá trị tương ứng.
     */
    const createDto: CreateReportDto = {
      reporter_id: 'user-uuid-1',
      target_type: TargetReportType.RECIPE,
      target_id: 'recipe-uuid-1',
      reason: ReportReason.SPAM,
      description: 'Spam content',
      status: ReportStatus.PENDING,
      handler_id: 'admin-uuid-1',
    };

    it('should create and return a report', async () => {
      // Sắp xếp (Arrange): mock prisma trả về mockReport
      prisma.report.create.mockResolvedValue(mockReport);

      // Hành động (Act)
      const result = await service.create(createDto);

      // Kiểm tra (Assert)
      expect(result).toEqual(mockReport);
      expect(prisma.report.create).toHaveBeenCalledTimes(1);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: { ...createDto },
      });
    });

    it('should call prisma.report.create with exact DTO fields', async () => {
      prisma.report.create.mockResolvedValue(mockReport);

      await service.create(createDto);

      // Xác nhận data truyền vào prisma chứa đúng các field từ DTO
      const calledWith = prisma.report.create.mock.calls[0][0];
      expect(calledWith.data.reporter_id).toBe(createDto.reporter_id);
      expect(calledWith.data.target_type).toBe(createDto.target_type);
      expect(calledWith.data.reason).toBe(createDto.reason);
    });

    it('should create a report without optional description', async () => {
      const dtoWithoutDescription: CreateReportDto = {
        reporter_id: 'user-uuid-2',
        target_type: TargetReportType.USER,
        target_id: 'user-uuid-3',
        reason: ReportReason.FAKE_ACCOUNT,
        status: ReportStatus.PENDING,
        handler_id: 'admin-uuid-1',
      };

      const expectedReport = { ...mockReport, description: undefined };
      prisma.report.create.mockResolvedValue(expectedReport);

      const result = await service.create(dtoWithoutDescription);

      expect(result).toEqual(expectedReport);
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: { ...dtoWithoutDescription },
      });
    });

    it('should propagate error if prisma throws', async () => {
      // Mô phỏng lỗi DB (vd: duplicate key, DB down)
      prisma.report.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createDto)).rejects.toThrow('DB Error');
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 3: findAll()
  // Kiểm tra lấy tất cả reports
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
  // Kiểm tra lấy một report theo id
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
      // Prisma findUnique trả về null khi không tìm thấy
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
  // Kiểm tra cập nhật trạng thái report
  // ─────────────────────────────────────────────
  describe('update()', () => {
    /**
     * Để thêm test case update:
     * - Tạo updateDto với các field khác (vd: chỉ update description)
     * - Mock prisma.report.update trả về report đã thay đổi
     * - Kiểm tra result có đúng không
     */
    const updateDto: UpdateReportDto = {
      status: ReportStatus.RESOLVED,
    };

    const updatedReport = { ...mockReport, status: ReportStatus.RESOLVED };

    it('should update and return the updated report', async () => {
      prisma.report.update.mockResolvedValue(updatedReport);

      const result = await service.update('report-uuid-1', updateDto);

      expect(result).toEqual(updatedReport);
      expect(result.status).toBe(ReportStatus.RESOLVED);
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

    it('should update only the provided fields (partial update)', async () => {
      const partialDto: UpdateReportDto = {
        description: 'Updated description only',
      };
      const partialUpdated = { ...mockReport, description: 'Updated description only' };
      prisma.report.update.mockResolvedValue(partialUpdated);

      await service.update('report-uuid-1', partialDto);

      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { id: 'report-uuid-1' },
        data: { description: 'Updated description only' },
      });
    });

    it('should update status from PENDING to DISMISSED', async () => {
      const dismissDto: UpdateReportDto = { status: ReportStatus.DISMISSED };
      const dismissedReport = { ...mockReport, status: ReportStatus.DISMISSED };
      prisma.report.update.mockResolvedValue(dismissedReport);

      const result = await service.update('report-uuid-1', dismissDto);

      expect(result.status).toBe(ReportStatus.DISMISSED);
    });

    it('should propagate error if report is not found', async () => {
      // Prisma update ném lỗi P2025 khi record không tồn tại
      prisma.report.update.mockRejectedValue(
        new Error('Record to update not found.'),
      );

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow('Record to update not found.');
    });
  });
});
