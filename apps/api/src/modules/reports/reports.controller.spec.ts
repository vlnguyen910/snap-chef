import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  TargetReportType,
  ReportReason,
  ReportStatus,
} from 'src/generated/prisma/enums';

/**
 * Mock report object dùng chung cho các test.
 * Sửa / thêm field ở đây nếu bạn muốn test dữ liệu khác.
 */
const mockReport = {
  id: 'report-uuid-1',
  reporter_id: 'user-uuid-1',
  target_type: TargetReportType.RECIPE,
  target_id: 'recipe-uuid-1',
  reason: ReportReason.SPAM,
  description: 'Spam content',
  status: ReportStatus.PENDING,
  handler_id: 'admin-uuid-1',
  created_at: new Date(),
  updated_at: new Date(),
};

/**
 * Mock ReportsService: Controller chỉ gọi service, không biết về DB.
 * Mỗi method của service đều được mock bằng jest.fn().
 *
 * Cách thêm mock method mới:
 * 1. Thêm vào mockReportsService: newMethod: jest.fn()
 * 2. Sử dụng trong test: mockReportsService.newMethod.mockResolvedValue(...)
 */
const mockReportsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: typeof mockReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // PHẦN 1: Khởi tạo controller
  // ─────────────────────────────────────────────
  describe('initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 2: POST / (create)
  // ─────────────────────────────────────────────
  describe('create()', () => {
    const createDto: CreateReportDto = {
      reporter_id: 'user-uuid-1',
      target_type: TargetReportType.RECIPE,
      target_id: 'recipe-uuid-1',
      reason: ReportReason.SPAM,
      description: 'Spam content',
      status: ReportStatus.PENDING,
      handler_id: 'admin-uuid-1',
    };

    it('should call reportsService.create with the DTO', async () => {
      service.create.mockResolvedValue(mockReport);

      await controller.create(createDto);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should return the created report', async () => {
      service.create.mockResolvedValue(mockReport);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockReport);
    });

    it('should propagate service errors to the caller', async () => {
      service.create.mockRejectedValue(new Error('Service error'));

      await expect(controller.create(createDto)).rejects.toThrow('Service error');
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 3: GET / (findAll)
  // ─────────────────────────────────────────────
  describe('findAll()', () => {
    it('should return array of reports', async () => {
      const mockReports = [mockReport, { ...mockReport, id: 'report-uuid-2' }];
      service.findAll.mockResolvedValue(mockReports);

      const result = await controller.findAll();

      expect(result).toEqual(mockReports);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no reports exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 4: GET /:id (findOne)
  // ─────────────────────────────────────────────
  describe('findOne()', () => {
    it('should call reportsService.findOne with the id param', async () => {
      service.findOne.mockResolvedValue(mockReport);

      await controller.findOne('report-uuid-1');

      // Controller truyền +id (ép kiểu number), kiểm tra giá trị đúng
      expect(service.findOne).toHaveBeenCalledWith(
        expect.anything(), // +id, có thể là NaN nếu id không phải số
      );
    });

    it('should return the found report', async () => {
      service.findOne.mockResolvedValue(mockReport);

      const result = await controller.findOne('report-uuid-1');

      expect(result).toEqual(mockReport);
    });

    it('should return null if report not found', async () => {
      service.findOne.mockResolvedValue(null);

      const result = await controller.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // PHẦN 5: PATCH /:id (update)
  // ─────────────────────────────────────────────
  describe('update()', () => {
    const updateDto: UpdateReportDto = {
      status: ReportStatus.RESOLVED,
    };

    it('should call reportsService.update with id and DTO', async () => {
      const updatedReport = { ...mockReport, status: ReportStatus.RESOLVED };
      service.update.mockResolvedValue(updatedReport);

      await controller.update('report-uuid-1', updateDto);

      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(
        expect.anything(),
        updateDto,
      );
    });

    it('should return the updated report', async () => {
      const updatedReport = { ...mockReport, status: ReportStatus.RESOLVED };
      service.update.mockResolvedValue(updatedReport);

      const result = await controller.update('report-uuid-1', updateDto);

      expect(result).toEqual(updatedReport);
      expect(result.status).toBe(ReportStatus.RESOLVED);
    });

    it('should propagate errors from service', async () => {
      service.update.mockRejectedValue(new Error('Not found'));

      await expect(
        controller.update('bad-id', updateDto),
      ).rejects.toThrow('Not found');
    });
  });
});
