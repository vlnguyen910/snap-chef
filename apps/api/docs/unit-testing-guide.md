# Unit Testing Guide — NestJS (Snap Chef API)

Hướng dẫn này giải thích cách viết unit tests cho các module NestJS trong dự án, lấy **Report Module** làm ví dụ minh hoạ.

## Tổng quan

Unit test trong NestJS sử dụng **Jest** + **@nestjs/testing**. Các dependency thật (Database, Redis, ...) được thay bằng **mock object** để test chạy nhanh, độc lập và không cần môi trường thật.

---

## Chạy test

```bash
# Chạy toàn bộ test suite
pnpm run test

# Chạy test của một module cụ thể (ví dụ: reports)
npx jest reports --no-coverage

# Chạy với báo cáo coverage
npx jest reports.service.spec.ts reports.controller.spec.ts \
  --coverage --coverageReporters=text \
  --collectCoverageFrom="**/modules/reports/**/*.ts"

# Watch mode (tự động chạy lại khi file thay đổi)
pnpm run test:watch
```

---

## Cấu trúc file test

Mỗi module có 2 file test nằm cạnh source:

```
src/modules/reports/
├── reports.service.ts
├── reports.service.spec.ts     ← test cho service
├── reports.controller.ts
├── reports.controller.spec.ts  ← test cho controller
├── reports.module.ts
└── dto/
    ├── create-report.dto.ts
    └── update-report.dto.ts
```

---

## Nguyên lý: Mock thay vì kết nối thật

Unit test không được kết nối DB hay bất kỳ service thật nào. Thay vào đó, ta tạo **mock object** có cùng interface và inject vào Module.

### Mock PrismaService (dành cho Service test)

```typescript
const mockPrismaService = {
  report: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Inject vào Testing Module
await Test.createTestingModule({
  providers: [
    ReportsService,
    { provide: PrismaService, useValue: mockPrismaService },
  ],
}).compile();
```

### Mock Service (dành cho Controller test)

```typescript
const mockReportsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

await Test.createTestingModule({
  controllers: [ReportsController],
  providers: [{ provide: ReportsService, useValue: mockReportsService }],
}).compile();
```

---

## Cấu trúc một test case — Pattern AAA

Mọi test case đều theo 3 bước: **Arrange → Act → Assert**.

```typescript
it('should create and return a report', async () => {
  // 1. ARRANGE — mock trả về dữ liệu gì
  prisma.report.create.mockResolvedValue(mockReport);

  // 2. ACT — gọi hàm cần test
  const result = await service.create(createDto);

  // 3. ASSERT — kiểm tra kết quả
  expect(result).toEqual(mockReport);
  expect(prisma.report.create).toHaveBeenCalledWith({ data: { ...createDto } });
});
```

---

## Các loại assertion phổ biến

| Assertion                              | Ý nghĩa                         |
| -------------------------------------- | ------------------------------- |
| `expect(x).toEqual(y)`                 | So sánh deep equality           |
| `expect(x).toBe(y)`                    | So sánh strict equality (`===`) |
| `expect(x).toBeNull()`                 | x phải là `null`                |
| `expect(x).toHaveLength(n)`            | Array x có n phần tử            |
| `expect(fn).toHaveBeenCalledTimes(n)`  | Hàm fn đã được gọi n lần        |
| `expect(fn).toHaveBeenCalledWith(arg)` | Hàm fn được gọi với args cụ thể |
| `expect(fn).rejects.toThrow('msg')`    | Promise bị reject với message   |

---

## Hướng dẫn thêm test case mới

### 1. Happy path (thành công)

Thêm vào `describe()` block tương ứng với method cần test:

```typescript
it('should create a report for a USER target', async () => {
  const dto: CreateReportDto = {
    reporter_id: 'reporter-uuid',
    target_type: TargetReportType.USER,
    target_id: 'target-user-uuid',
    reason: ReportReason.FAKE_ACCOUNT,
    status: ReportStatus.PENDING,
    handler_id: 'admin-uuid',
  };

  prisma.report.create.mockResolvedValue({
    ...mockReport,
    target_type: TargetReportType.USER,
  });

  const result = await service.create(dto);
  expect(result.target_type).toBe(TargetReportType.USER);
});
```

### 2. Error path (thất bại / exception)

```typescript
it('should throw when DB fails', async () => {
  prisma.report.create.mockRejectedValue(new Error('DB connection failed'));

  await expect(service.create(createDto)).rejects.toThrow(
    'DB connection failed',
  );
});
```

### 3. Edge case (trường hợp biên)

```typescript
it('should return empty array when no reports exist', async () => {
  prisma.report.findMany.mockResolvedValue([]);
  const result = await service.findAll();
  expect(result).toHaveLength(0);
});
```

---

## Reset mock sau mỗi test

Luôn dùng `afterEach(() => jest.clearAllMocks())` để tránh state từ test này ảnh hưởng test khác:

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

---

## Checklist khi viết test mới

- [ ] File đặt đúng vị trí: cạnh source file, đuôi `.spec.ts`
- [ ] Tạo mock cho **mọi** dependency của class đang test
- [ ] Viết test cho cả **happy path** và **error path**
- [ ] Mỗi `it()` chỉ test **một behaviour** duy nhất
- [ ] Tên test rõ ràng: `'should <action> when <condition>'`
- [ ] Gọi `jest.clearAllMocks()` trong `afterEach`

---

## Coverage hiện tại — Report Module

| File                    | Statements | Functions | Lines | Branches |
| ----------------------- | ---------- | --------- | ----- | -------- |
| `reports.service.ts`    | 100%       | 100%      | 100%  | 75%      |
| `reports.controller.ts` | 100%       | 100%      | 100%  | 75%      |

> **Mục tiêu:** duy trì > 50% coverage cho mỗi module mới.

---

## Tham khảo

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest API Reference](https://jestjs.io/docs/api)
- [Jest Mock Functions](https://jestjs.io/docs/mock-function-api)
