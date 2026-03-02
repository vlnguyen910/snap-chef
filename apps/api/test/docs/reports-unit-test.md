# Unit Test — Report Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Report Module**, bao gồm `ReportsService` và `ReportsController`.

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [ReportsService — reports.service.spec.ts](#3-reportsservice)
4. [ReportsController — reports.controller.spec.ts](#4-reportscontroller)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/reports/
├── reports.module.ts
├── reports.service.ts           ← business logic, giao tiếp với DB qua PrismaService
├── reports.service.spec.ts      ← unit test cho service
├── reports.controller.ts        ← HTTP handler, uỷ quyền logic cho service
├── reports.controller.spec.ts   ← unit test cho controller
└── dto/
    ├── create-report.dto.ts     ← DTO tạo report mới
    └── update-report.dto.ts     ← DTO cập nhật report (các field đều optional)
```

**Luồng xử lý:** `HTTP Request → Controller → Service → PrismaService → PostgreSQL`

**Enums liên quan** (`src/generated/prisma/enums`):

| Enum | Các giá trị |
|------|------------|
| `TargetReportType` | `RECIPE`, `USER`, `COMMENT` |
| `ReportReason` | `SPAM`, `FAKE_ACCOUNT`, `INAPPROPRIATE_CONTENT`, `VIOLENCE`, `OTHER` |
| `ReportStatus` | `PENDING`, `RESOLVED`, `DISMISSED` |

---

## 2. Dữ liệu mock dùng chung

Cả hai file spec đều định nghĩa một `mockReport` object đại diện cho một report đã tồn tại trong DB:

```typescript
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
```

> **Lưu ý:** `description` là field **optional** trong `CreateReportDto`. Một số test case sẽ bỏ qua field này để kiểm tra hành vi khi không có mô tả.

---

## 3. ReportsService

File: `src/modules/reports/reports.service.spec.ts`

### Thiết lập (Setup)

`PrismaService` được thay bằng mock object, tránh kết nối DB thật:

```typescript
const mockPrismaService = {
  report: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};
```

`jest.clearAllMocks()` được gọi trong `afterEach` để reset trạng thái mock sau mỗi test.

---

### 3.1 `initialization`

| # | Tên test case | Mục đích |
|---|--------------|----------|
| 1 | `should be defined` | Xác nhận `ReportsService` được khởi tạo thành công qua DI container |

---

### 3.2 `create(dto: CreateReportDto)`

Prisma call: `prisma.report.create({ data: { ...dto } })`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should create and return a report` | Happy path | Gọi `service.create(dto)`, kiểm tra kết quả trả về bằng `mockReport` và `prisma.report.create` được gọi đúng 1 lần với đúng payload |
| 2 | `should call prisma.report.create with exact DTO fields` | Happy path | Kiểm tra chi tiết các field `reporter_id`, `target_type`, `reason` được truyền đúng vào Prisma |
| 3 | `should create a report without optional description` | Edge case | `description` bị bỏ qua trong DTO — xác nhận service vẫn hoạt động đúng và Prisma nhận payload không có `description` |
| 4 | `should propagate error if prisma throws` | Error path | Prisma throw `Error('DB Error')` — xác nhận service không nuốt lỗi, promise bị reject với cùng message |

---

### 3.3 `findAll()`

Prisma call: `prisma.report.findMany()`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return an array of reports` | Happy path | Prisma trả về mảng 2 phần tử — kiểm tra độ dài và nội dung kết quả |
| 2 | `should return empty array when no reports exist` | Edge case | Prisma trả về mảng rỗng `[]` — xác nhận service trả về đúng `[]` |
| 3 | `should propagate error if prisma throws` | Error path | Prisma throw `Error('Connection failed')` — service phải re-throw lỗi này |

---

### 3.4 `findOne(id: string)`

Prisma call: `prisma.report.findUnique({ where: { id } })`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return a report when found` | Happy path | Prisma `findUnique` trả về `mockReport` — kiểm tra service trả về đúng object và truyền đúng `where: { id }` |
| 2 | `should return null when report is not found` | Edge case | `findUnique` trả về `null` (record không tồn tại) — service phải trả về `null` thay vì throw |
| 3 | `should pass the correct id to prisma` | Happy path | Xác nhận `where: { id: testId }` được truyền chính xác vào Prisma |
| 4 | `should propagate error if prisma throws` | Error path | Prisma throw — service phải re-throw lỗi |

---

### 3.5 `update(id: string, payload: UpdateReportDto)`

Prisma call: `prisma.report.update({ where: { id }, data: { ...payload } })`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should update and return the updated report` | Happy path | Cập nhật `status → RESOLVED`, kiểm tra kết quả trả về và `prisma.report.update` được gọi 1 lần |
| 2 | `should call prisma.update with correct id and payload` | Happy path | Xác nhận `where: { id }` và `data: { ...updateDto }` được truyền chính xác |
| 3 | `should update only the provided fields (partial update)` | Edge case | DTO chỉ chứa `description` — kiểm tra Prisma chỉ nhận đúng field đó, không có field thừa |
| 4 | `should update status from PENDING to DISMISSED` | Edge case | Kiểm tra status workflow: `PENDING → DISMISSED` hoạt động đúng |
| 5 | `should propagate error if report is not found` | Error path | Prisma throw `Error('Record to update not found.')` (tương đương Prisma error P2025) — service phải re-throw |

---

## 4. ReportsController

File: `src/modules/reports/reports.controller.spec.ts`

### Thiết lập (Setup)

`ReportsService` được thay bằng mock object — controller chỉ được test theo vai trò HTTP handler, không biết về logic hay DB:

```typescript
const mockReportsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
```

---

### 4.1 `initialization`

| # | Tên test case | Mục đích |
|---|--------------|----------|
| 1 | `should be defined` | Xác nhận `ReportsController` được khởi tạo thành công |

---

### 4.2 `create()` — `POST /reports`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.create with the DTO` | Happy path | Xác nhận controller truyền đúng `createDto` vào `reportsService.create`, được gọi đúng 1 lần |
| 2 | `should return the created report` | Happy path | Kiểm tra controller trả về kết quả từ service (`mockReport`) |
| 3 | `should propagate service errors to the caller` | Error path | Service throw — controller không bắt lỗi, để NestJS exception filter xử lý |

---

### 4.3 `findAll()` — `GET /reports`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return array of reports` | Happy path | Service trả về 2 reports — kiểm tra controller trả về đúng mảng, `findAll` được gọi 1 lần |
| 2 | `should return empty array when no reports exist` | Edge case | Service trả về `[]` — controller trả về đúng `[]` |

---

### 4.4 `findOne(:id)` — `GET /reports/:id`

> **Lưu ý kỹ thuật:** Controller hiện tại truyền `+id` (ép kiểu sang number) vào `reportsService.findOne()`. Vì `id` trong DB là `string` (UUID), `+id` sẽ cho ra `NaN`. Test case dùng `expect.anything()` để bỏ qua giá trị cụ thể này.

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.findOne with the id param` | Happy path | Xác nhận `findOne` được gọi với giá trị là kết quả của `+id` |
| 2 | `should return the found report` | Happy path | Service tìm thấy report — controller trả về đúng object |
| 3 | `should return null if report not found` | Edge case | Service trả về `null` — controller trả về `null` |

---

### 4.5 `update(:id)` — `PATCH /reports/:id`

> **Lưu ý kỹ thuật:** Tương tự `findOne`, controller truyền `+id` vào service. Test dùng `expect.anything()` cho tham số id.

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.update with id and DTO` | Happy path | Xác nhận `reportsService.update` được gọi với `id` và `updateDto` đúng |
| 2 | `should return the updated report` | Happy path | Kiểm tra kết quả trả về có `status === RESOLVED` |
| 3 | `should propagate errors from service` | Error path | Service throw — controller re-throw lỗi |

---

### 4.6 `remove(:id)` — `DELETE /reports/:id`

> **Lưu ý:** `ReportsService` hiện **chưa có** method `remove()`. Controller gọi `this.reportsService.remove(+id)` nhưng service chưa implement. Các test case này kiểm tra hành vi của controller, chờ phần service được implement.

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.remove with the id param` | Happy path | Xác nhận `reportsService.remove` được gọi đúng 1 lần |
| 2 | `should return the result from service.remove` | Happy path | Service trả về `{ deleted: true }` — controller trả về đúng giá trị đó |

---

## 5. Coverage hiện tại

Chạy lệnh sau để xem coverage chi tiết:

```bash
npx jest reports.service.spec.ts reports.controller.spec.ts \
  --coverage --coverageReporters=text \
  --collectCoverageFrom="**/modules/reports/**/*.ts"
```

| File | Statements | Functions | Lines | Branches |
|------|-----------|-----------|-------|---------|
| `reports.service.ts` | 100% | 100% | 100% | 75% |
| `reports.controller.ts` | 100% | 100% | 100% | 75% |

> **Lý do Branches chưa đạt 100%:** Prisma trả về kiểu `null | Report` nhưng controller không có guard kiểm tra `null` (ví dụ: throw `NotFoundException` khi `findOne` trả về `null`). Khi thêm logic đó, cần bổ sung test case tương ứng.

---

## 6. Hướng dẫn mở rộng test

### Thêm test khi `findOne` trả về `null` → throw `NotFoundException`

```typescript
// Thêm vào reports.service.spec.ts — describe('findOne()')
it('should throw NotFoundException when report is not found', async () => {
  prisma.report.findUnique.mockResolvedValue(null);
  await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
});
```

### Thêm test cho method `remove()` khi service được implement

```typescript
// Thêm delete vào mockPrismaService
const mockPrismaService = {
  report: {
    // ...các method hiện có
    delete: jest.fn(),
  },
};

it('should delete and return the deleted report', async () => {
  prisma.report.delete.mockResolvedValue(mockReport);
  const result = await service.remove('report-uuid-1');
  expect(result).toEqual(mockReport);
  expect(prisma.report.delete).toHaveBeenCalledWith({ where: { id: 'report-uuid-1' } });
});
```

### Thêm test cho `TargetReportType.COMMENT`

```typescript
it('should create a report targeting a COMMENT', async () => {
  const dto: CreateReportDto = {
    reporter_id: 'user-uuid-1',
    target_type: TargetReportType.COMMENT,
    target_id: 'comment-uuid-1',
    reason: ReportReason.INAPPROPRIATE_CONTENT,
    status: ReportStatus.PENDING,
    handler_id: 'admin-uuid-1',
  };
  prisma.report.create.mockResolvedValue({ ...mockReport, target_type: TargetReportType.COMMENT });
  const result = await service.create(dto);
  expect(result.target_type).toBe(TargetReportType.COMMENT);
});
```

---

*Tài liệu này được tạo dựa trên trạng thái code tại thời điểm **2026-03-02**. Cập nhật tài liệu khi thêm hoặc thay đổi test case.*
