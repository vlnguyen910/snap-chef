# Unit Test — Notifications Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Notifications Module** (`NotificationService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [NotificationService — notification.service.spec.ts](#4-notificationservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/notifications/
├── notification.module.ts
├── notification.service.ts         ← business logic (file này)
├── notification.service.spec.ts    ← unit test
├── notification.gateway.ts         ← WebSocket gateway (real-time delivery)
├── notification.controller.ts      ← HTTP endpoints
└── dto/
    └── create-notification.dto.ts
```

**Dependencies của NotificationService:**

| Dependency | Vai trò |
|---|---|
| `PrismaService` | Lưu, đọc, cập nhật, xóa notification trong DB |
| `NotificationGateway` | Gửi event real-time qua WebSocket (Socket.IO) |

**Luồng tạo notification:**
```
Service.createNotification(dto)
  → prisma.notification.create()        ← lưu vào DB
  → notificationGateway.sendToUser()    ← gửi real-time
  → return notification
```

---

## 2. Dữ liệu mock dùng chung

```typescript
const mockNotification = {
  id:            1,
  receiver_id:   'user-uuid-1',
  sender_id:     'user-uuid-2',
  type:          NotificationType.LIKE,
  message:       'testuser liked your recipe',
  resource_id:   'recipe-uuid-1',
  resource_type: NotificationResourceType.RECIPE,
  is_read:       false,
  created_at:    new Date(),
  sender: { id: 'user-uuid-2', username: 'testuser', avatar_url: null },
};

const createDto = {
  receiverId:   'user-uuid-1',
  senderId:     'user-uuid-2',
  type:         NotificationType.LIKE,
  message:      'testuser liked your recipe',
  resourceId:   'recipe-uuid-1',
  resourceType: NotificationResourceType.RECIPE,
};
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  notification: {
    create:     jest.fn(),
    findMany:   jest.fn(),
    update:     jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockNotificationGateway = {
  sendToUser: jest.fn(),
};
```

> **Tại sao mock `NotificationGateway`?** Gateway quản lý WebSocket connections thực tế (Redis adapter, Socket.IO). Mock giúp test chạy không cần server WS thật, đồng thời kiểm tra service có gọi gateway đúng arguments không.

---

## 4. NotificationService

File: `src/modules/notifications/notification.service.spec.ts` — **12 test cases**

---

### 4.1 `initialization`

| # | Test case | Mô tả |
|---|---|---|
| 1 | `should be defined` | Service được khởi tạo thành công |

---

### 4.2 `createNotification(dto: CreateNotificationDto)`

Lưu notification vào DB và gửi real-time qua WebSocket.

> **Ghi chú về log:** Khi test case kiểm tra error path, service's `Logger.error()` sẽ in ra console. Đây là behavior bình thường — không phải test failure.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 2 | `should create notification in DB and send via WebSocket` | Happy path | `prisma.notification.create` được gọi với đúng field mapping, trả về notification object |
| 3 | `should emit NEW_NOTIFICATION event to the receiver via WebSocket gateway` | Happy path | `gateway.sendToUser(receiverId, WebSocketEvents.NEW_NOTIFICATION, notification)` được gọi |
| 4 | `should propagate error if DB operation fails` | Error path | Prisma throw → service re-throw (không nuốt lỗi) |
| 5 | `should not send WebSocket event if DB operation fails` | Error path | Khi Prisma fail → `gateway.sendToUser` **không** được gọi (đúng thứ tự) |

**Field mapping DTO → Prisma được kiểm tra:**

| DTO field | Prisma field |
|---|---|
| `receiverId` | `receiver_id` |
| `senderId` | `sender_id` |
| `type` | `type` |
| `message` | `message` |
| `resourceId` | `resource_id` |
| `resourceType` | `resource_type` |

---

### 4.3 `getNotifications(userId: string)`

Lấy tất cả notifications của user, sắp xếp mới nhất trước, bao gồm sender info.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 6 | `should return notifications for a user ordered by newest first` | Happy path | `findMany({ where: { receiver_id }, orderBy: { created_at: 'desc' }, include: { sender: ... } })` |
| 7 | `should return empty array when user has no notifications` | Edge case | Prisma trả về `[]` → service trả về `[]` |

---

### 4.4 `markAsRead(userId, notificationId)`

Đánh dấu một notification cụ thể là đã đọc.

> **Bảo vệ:** `where` bao gồm cả `receiver_id: userId` — đảm bảo user chỉ đánh dấu notification của **chính mình**, không thể đánh dấu notification của người khác.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 8 | `should mark a specific notification as read` | Happy path | `update({ where: { id: 1, receiver_id: 'user-uuid-1' }, data: { is_read: true } })` |

---

### 4.5 `markAllAsRead(userId: string)`

Đánh dấu tất cả notifications chưa đọc là đã đọc.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 9 | `should mark all unread notifications as read` | Happy path | `updateMany({ where: { receiver_id, is_read: false }, data: { is_read: true } })` → `{ count: 3 }` |
| 10 | `should return count 0 when all notifications are already read` | Edge case | Tất cả đã đọc → `{ count: 0 }` |

---

### 4.6 `cleanUpOldNotifications()` — Cron job

Xóa tự động notifications cũ hơn 30 ngày. Chạy lúc **00:00 UTC mỗi ngày** (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`).

> **Tại sao test Cron job?** Để đảm bảo filter `lte: thirtyDaysAgo` được xây dựng đúng. Nếu filter sai, notifications sẽ không bao giờ bị xóa hoặc bị xóa sai.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 11 | `should delete notifications older than 30 days` | Happy path | `deleteMany({ where: { created_at: { lte: expect.any(Date) } } })` |
| 12 | `should not throw when there are no old notifications` | Edge case | `{ count: 0 }` → không throw |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       12 passed, 0 failed
```

```bash
cd apps/api
pnpm run test --testPathPattern="notification.service" --coverage \
  --collectCoverageFrom="**/modules/notifications/notification.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test xác nhận ngày cutoff đúng (30 ngày)

```typescript
it('should use a cutoff date exactly 30 days in the past', async () => {
  mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 0 });
  const now = new Date();

  await service.cleanUpOldNotifications();

  const callArgs = mockPrismaService.notification.deleteMany.mock.calls[0][0];
  const cutoff: Date = callArgs.where.created_at.lte;

  // Cutoff phải trong khoảng ±1 giây so với (now - 30 ngày)
  const expectedCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  expect(Math.abs(cutoff.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
});
```

### Thêm test `getNotifications` với pagination

```typescript
it('should support pagination for notifications', async () => {
  mockPrismaService.notification.findMany.mockResolvedValue([]);

  await service.getNotifications('user-1', { page: 2, limit: 10 });

  expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 10, take: 10 }),
  );
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case.*
