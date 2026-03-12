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
    ├── create-report.dto.ts     ← DTO tạo report (target_type, target_id, reason, description?)
    └── update-report.dto.ts     ← DTO cập nhật report cho admin (status?, handler_id?)
```

**Luồng xử lý:** `HTTP Request → JwtAuthGuard → RolesGuard → Controller → Service → PrismaService → PostgreSQL`

**Enums liên quan** (`src/generated/prisma/enums`):

| Enum | Các giá trị |
|------|------------|
| `TargetReportType` | `RECIPE`, `USER` |
| `ReportReason` | `SPAM`, `INAPORIATE_CONTENT`, `COPYRIGHT_VIOLATION`, `IRRELEVANT_CONTENT`, `FAKE_ACCOUNT`, `OTHER` |
| `ReportStatus` | `PENDING`, `RESOLVED`, `DISMISSED` |

**Phân quyền:**

| Endpoint | Role yêu cầu |
|----------|-------------|
| `POST /reports` | `USER` — user submit report |
| `GET /reports` | `ADMIN` — xem tất cả reports |
| `GET /reports/:id` | `ADMIN` |
| `PATCH /reports/:id` | `ADMIN` — xử lý report (đổi status, assign handler) |

---

## 2. Dữ liệu mock dùng chung

### mockReport

```typescript
const mockReport = {
  id: 'report-uuid-1',
  reporter_id: 'user-uuid-1',
  target_type: TargetReportType.RECIPE,
  target_id: 'recipe-uuid-1',
  reason: ReportReason.SPAM,
  description: 'Spam content',
  status: ReportStatus.PENDING,
  handler_id: null,           // null vì mới tạo, chưa có admin xử lý
  created_at: new Date(),
  updated_at: new Date(),
};
```

> **Lưu ý:** `handler_id` mặc định là `null` khi report mới được tạo. Admin sẽ được assign sau qua `PATCH /reports/:id`.

### mockUser (chỉ dùng trong controller spec)

```typescript
const mockUser: TokenPayload = {
  sub: 'user-uuid-1',    // đây là user id, được dùng thay vì user.id
  email: 'user@example.com',
  username: 'testuser',
  role: UserRoles.USER,
  is_verified: true,
  type: JwtTokenType.AccessToken,
  jti: 'some-jti',
};
```

> **Tại sao dùng `TokenPayload` thay vì `User`?** `@GetUser()` decorator lấy `request.user` — đây là object do `JwtStrategy.validate()` trả về, có type là `TokenPayload` (chứa `sub`, không phải `id`). Controller gọi `user.sub` để lấy user id.

---

## 3. ReportsService

File: `src/modules/reports/reports.service.spec.ts`

### Thiết lập (Setup)

Service inject 3 dependencies, tất cả đều được mock:

```typescript
// Mock PrismaService — tránh kết nối DB thật
const mockPrismaService = {
  report: { create, findMany, findUnique, update },
  user:   { findMany },   // dùng để query danh sách admin
};

// Mock NotificationService — gửi noti đến admin khi có report mới
const mockNotificationService = {
  createNotification: jest.fn(),
};

// Mock UsersService — xác nhận reporter tồn tại
const mockUsersService = {
  findOne: jest.fn(),
};
```

---

### 3.1 `initialization`

| # | Tên test case | Mục đích |
|---|--------------|----------|
| 1 | `should be defined` | Xác nhận `ReportsService` được khởi tạo thành công qua DI container |

---

### 3.2 `create(reporterId: string, dto: CreateReportDto)`

> **Lưu ý:** `reporter_id` không nằm trong `CreateReportDto` nữa. Nó được truyền riêng từ JWT token (`user.sub`).  
> Sau khi tạo report, service tự động gửi notification đến tất cả admin.

```typescript
// CreateReportDto hiện tại — không có reporter_id, handler_id, status
const createDto: CreateReportDto = {
  target_type: TargetReportType.RECIPE,
  target_id:   'recipe-uuid-1',
  reason:      ReportReason.SPAM,
  description: 'Spam content',   // optional
};
```

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should create and return a report` | Happy path | Gọi `service.create(reporterId, dto)`, kiểm tra `prisma.report.create` nhận `{ reporter_id, ...dto }` |
| 2 | `should throw NotFoundException if reporter does not exist` | Error path | `usersService.findOne` trả về `null` → service throw `NotFoundException` |
| 3 | `should send notifications to all admins after creating report` | Happy path | Có 1 admin → `notificationService.createNotification` được gọi 1 lần với đúng `senderId` và `receiverId` |
| 4 | `should not send notifications if no admins exist` | Edge case | Không có admin nào → `createNotification` không được gọi |
| 5 | `should create report without optional description` | Edge case | `description` bị bỏ → service vẫn hoạt động đúng |
| 6 | `should propagate error if prisma throws` | Error path | Prisma throw `'DB Error'` → service re-throw |

---

### 3.3 `findAll()`

Prisma call: `prisma.report.findMany()`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return an array of reports` | Happy path | Prisma trả về mảng 2 phần tử — kiểm tra độ dài và nội dung |
| 2 | `should return empty array when no reports exist` | Edge case | Prisma trả về `[]` — service trả về đúng `[]` |
| 3 | `should propagate error if prisma throws` | Error path | Prisma throw `'Connection failed'` — service re-throw |

---

### 3.4 `findOne(id: string)`

Prisma call: `prisma.report.findUnique({ where: { id } })`

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return a report when found` | Happy path | `findUnique` trả về `mockReport` — kiểm tra `where: { id }` đúng |
| 2 | `should return null when report is not found` | Edge case | `findUnique` trả về `null` — service trả về `null` (không throw) |
| 3 | `should pass the correct id to prisma` | Happy path | Xác nhận `where: { id: testId }` truyền chính xác |
| 4 | `should propagate error if prisma throws` | Error path | Prisma throw → service re-throw |

---

### 3.5 `update(id: string, payload: UpdateReportDto)`

Prisma call: `prisma.report.update({ where: { id }, data: { ...payload } })`

```typescript
// UpdateReportDto — chỉ dành cho admin, không có description
const updateDto: UpdateReportDto = {
  status:     ReportStatus.RESOLVED,  // optional
  handler_id: 'admin-uuid-1',          // optional
};
```

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should update and return the updated report` | Happy path | Cập nhật `status + handler_id`, kiểm tra kết quả trả về |
| 2 | `should call prisma.update with correct id and payload` | Happy path | Xác nhận `where: { id }` và `data: { ...updateDto }` là đúng |
| 3 | `should update only status (without handler_id)` | Edge case | DTO chỉ có `status` → Prisma nhận đúng `{ status }` |
| 4 | `should update only handler_id (without status)` | Edge case | DTO chỉ có `handler_id` → Prisma nhận đúng `{ handler_id }` |
| 5 | `should propagate error if report is not found` | Error path | Prisma throw P2025 — service re-throw |

---

## 4. ReportsController

File: `src/modules/reports/reports.controller.spec.ts`

### Thiết lập (Setup)

`ReportsService` được mock hoàn toàn — controller chỉ test vai trò HTTP handler:

```typescript
const mockReportsService = {
  create:  jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update:  jest.fn(),
};
```

---

### 4.1 `initialization`

| # | Tên test case | Mục đích |
|---|--------------|----------|
| 1 | `should be defined` | Xác nhận `ReportsController` được khởi tạo thành công |

---

### 4.2 `create()` — `POST /reports` (Role: USER)

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.create with user.sub and DTO` | Happy path | Controller gọi `service.create(user.sub, dto)` — xác nhận truyền đúng `user.sub` (không phải `user.id`) |
| 2 | `should return the created report` | Happy path | Controller trả về kết quả từ service |
| 3 | `should propagate service errors to the caller` | Error path | Service throw → controller không bắt, để NestJS exception filter xử lý |

---

### 4.3 `findAll()` — `GET /reports` (Role: ADMIN)

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should return array of reports` | Happy path | Service trả về 2 reports — kiểm tra mảng, `findAll` được gọi 1 lần |
| 2 | `should return empty array when no reports exist` | Edge case | Service trả về `[]` — controller trả về `[]` |

---

### 4.4 `findOne(:id)` — `GET /reports/:id` (Role: ADMIN)

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.findOne with the id param` | Happy path | Xác nhận `findOne('report-uuid-1')` được gọi đúng |
| 2 | `should return the found report` | Happy path | Service tìm thấy → controller trả về đúng object |
| 3 | `should return null if report not found` | Edge case | Service trả về `null` → controller trả về `null` |

---

### 4.5 `update(:id)` — `PATCH /reports/:id` (Role: ADMIN)

| # | Tên test case | Loại | Mô tả |
|---|--------------|------|-------|
| 1 | `should call reportsService.update with id and DTO` | Happy path | Xác nhận `service.update('report-uuid-1', updateDto)` được gọi đúng |
| 2 | `should return the updated report` | Happy path | Kiểm tra `status === RESOLVED` và `handler_id` đúng |
| 3 | `should update only status without handler_id` | Edge case | DTO chỉ có `status` → controller vẫn gọi service đúng |
| 4 | `should propagate errors from service` | Error path | Service throw → controller re-throw |

---

## 5. Coverage hiện tại

Chạy lệnh sau để xem coverage chi tiết:

```bash
npx jest reports --coverage --coverageReporters=text \
  --collectCoverageFrom="**/modules/reports/**/*.ts"
```

**Tổng: 32 tests / 2 suites — tất cả PASS ✅**

| File | Tests |
|------|-------|
| `reports.service.spec.ts` | 18 tests |
| `reports.controller.spec.ts` | 14 tests |

---

## 6. Hướng dẫn mở rộng test

### Thêm test khi `findOne` trả về `null` → throw `NotFoundException`

Nếu service được cập nhật để throw khi không tìm thấy:

```typescript
// Thêm vào describe('findOne()') trong reports.service.spec.ts
it('should throw NotFoundException when report is not found', async () => {
  prisma.report.findUnique.mockResolvedValue(null);
  await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
});
```

### Thêm test cho các ReportReason khác nhau

```typescript
it('should create a report with FAKE_ACCOUNT reason targeting a USER', async () => {
  const dto: CreateReportDto = {
    target_type: TargetReportType.USER,
    target_id:   'user-uuid-target',
    reason:      ReportReason.FAKE_ACCOUNT,
  };
  prisma.report.create.mockResolvedValue({ ...mockReport, ...dto });

  const result = await service.create('reporter-uuid', dto);

  expect(result.reason).toBe(ReportReason.FAKE_ACCOUNT);
  expect(result.target_type).toBe(TargetReportType.USER);
});
```

### Thêm test gửi noti cho nhiều admin

```typescript
it('should send notifications to ALL admins', async () => {
  const admins = [
    { id: 'admin-1', role: UserRoles.ADMIN },
    { id: 'admin-2', role: UserRoles.ADMIN },
  ];
  mockPrismaService.user.findMany.mockResolvedValue(admins);
  prisma.report.create.mockResolvedValue(mockReport);

  await service.create('user-uuid-1', createDto);

  expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-02**. Cập nhật khi thêm hoặc thay đổi test case.*
