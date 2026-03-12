# Unit Test — Comments Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Comments Module** (`CommentsService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [CommentsService — comments.service.spec.ts](#4-commentsservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/comments/
├── comments.module.ts
├── comments.service.ts         ← business logic
├── comments.service.spec.ts    ← unit test (file này)
└── dto/
    ├── create-comments.dto.ts  ← content, rating
    └── update-comment.dto.ts   ← content?, rating?
```

**Dependencies của CommentsService:**

| Dependency | Vai trò |
|---|---|
| `PrismaService` | Truy vấn `recipe`, `user`, `comment` |
| `NotificationService` | Gửi notification COMMENT đến recipe author |

**Phân quyền xóa / sửa comment:**

| Action | Được phép |
|---|---|
| Xóa comment | Commenter **hoặc** recipe author |
| Sửa comment | Chỉ commenter |

---

## 2. Dữ liệu mock dùng chung

```typescript
const mockUser   = { id: 'user-uuid-1', username: 'testuser', email: 'test@example.com' };
const mockRecipe = { id: 'recipe-uuid-1', title: 'Test Recipe', author_id: 'author-uuid-1' };

const mockComment = {
  id: 1,
  user_id:   'user-uuid-1',
  recipe_id: 'recipe-uuid-1',
  content:   'Great recipe!',
  rating:    5,
  created_at: new Date(),
  user:   mockUser,
  recipe: mockRecipe,
};
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  recipe:  { findUnique },
  user:    { findUnique },
  comment: { create, findUnique, findMany, delete, update },
};

const mockNotificationService = {
  createNotification: jest.fn(),
};
```

---

## 4. CommentsService

File: `src/modules/comments/comments.service.spec.ts` — **17 test cases**

---

### 4.1 `initialization`

| # | Test case | Mô tả |
|---|---|---|
| 1 | `should be defined` | NestJS inject đủ dependencies, service được tạo thành công |

---

### 4.2 `create(user_id, recipe_id, dto)`

Tạo comment mới cho recipe. Gửi COMMENT notification đến recipe author.

**Luồng:**
```
1. prisma.recipe.findUnique(recipe_id)  → kiểm tra recipe tồn tại
2. prisma.user.findUnique(user_id)      → kiểm tra user tồn tại
3. prisma.comment.create()              → tạo comment
4. notificationService.createNotification({ type: COMMENT }) → gửi noti
5. return { message: 'Comment Created' }
```

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 2 | `should create comment and return success message` | Happy path | Recipe & user tồn tại → `comment.create` được gọi với `{ user_id, recipe_id, content, rating }` |
| 3 | `should send COMMENT notification to recipe author` | Happy path | `createNotification` được gọi với `receiverId: recipe.author_id`, `type: COMMENT`, `resourceType: RECIPE` |
| 4 | `should throw NotFoundException if recipe does not exist` | Error path | `recipe.findUnique` trả về `null` → throw `RECIPE_NOT_FOUND`, không tạo comment |
| 5 | `should throw NotFoundException if user does not exist` | Error path | `user.findUnique` trả về `null` → throw `USER_NOT_FOUND`, không tạo comment |
| 6 | `should throw NotFoundException if users blocked each other` | Error path | Users block nhau → throw `RECIPE_NOT_FOUND` |

---

### 4.3 `findOneById(id: number)`

Tìm comment theo ID. Dùng nội bộ trong `deleteComment()` và `updateComment()`.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 7 | `should return a comment with user and recipe included` | Happy path | `findUnique({ where: { id }, include: { user: true, recipe: true } })` |
| 8 | `should return null when comment is not found` | Edge case | Prisma trả về `null` → service trả về `null` (không throw) |

---

### 4.4 `findAllCommentsOfRecipe(recipe_id, query)`

Lấy tất cả comments của một recipe với pagination, sắp xếp mới nhất trước.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 9 | `should return paginated comments for a recipe` | Happy path | `findMany({ where: { recipe_id }, skip: 0, take: 10 })` |
| 10 | `should apply correct skip for pagination` | Happy path | `page:2, limit:5` → `skip: 5, take: 5` |
| 11 | `should return empty array when no comments exist` | Edge case | Prisma trả về `[]` → service trả về `[]` |

---

### 4.5 `deleteComment(id, user_id)`

Xóa comment. Cho phép cả **commenter** lẫn **recipe author** xóa.

> **Lý do cho phép recipe author xóa:** Author có quyền moderation — họ có thể xóa comment spam hoặc vi phạm trên recipe của mình.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 12 | `should delete comment when called by the commenter` | Happy path | `comment.user_id === user_id` → xóa thành công |
| 13 | `should delete comment when called by the recipe author` | Happy path | `comment.recipe.author_id === user_id` → xóa thành công (moderation right) |
| 14 | `should throw NotFoundException if comment does not exist` | Error path | `findOneById` trả về `null` → throw `COMMENT_NOT_FOUND` |
| 15 | `should throw UnauthorizedException if user has no right to delete` | Error path | User không phải commenter cũng không phải author → throw `NO_RIGHT_DELETE_COMMENT` |

---

### 4.6 `updateComment(id, user_id, dto)`

Cập nhật nội dung comment. **Chỉ commenter** mới được sửa, khác với xóa.

> **Lý do chỉ commenter được sửa:** Recipe author chỉ có quyền xóa comment không phù hợp, không phải sửa nội dung — điều đó sẽ vi phạm quyền tác giả bình luận.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 16 | `should update comment and return success message` | Happy path | `comment.user_id === user_id` → `comment.update({ where: { id }, data: { content, rating } })` |
| 17 | `should throw NotFoundException if comment does not exist` | Error path | `findOneById` trả về `null` → throw `COMMENT_NOT_FOUND` |
| 18 | `should throw UnauthorizedException if user is not the commenter` | Error path | `comment.user_id !== user_id` → throw `NO_RIGHT_UPDATE_COMMENT` (recipe author cũng không được sửa) |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       18 passed, 0 failed
```

```bash
cd apps/api
pnpm run test --testPathPattern="comments.service" --coverage \
  --collectCoverageFrom="**/modules/comments/comments.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test rating validation (nếu có constraint)

```typescript
it('should create comment with rating at boundary values', async () => {
  mockPrismaService.recipe.findUnique.mockResolvedValue(mockRecipe);
  mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
  mockPrismaService.comment.create.mockResolvedValue({ ...mockComment, rating: 1 });

  await expect(service.create(mockUser.id, mockRecipe.id, { content: 'ok', rating: 1 }))
    .resolves.toEqual({ message: 'Comment Created' });
});
```

### Thêm test notification không gây fail khi delivery thất bại

```typescript
it('should still return success message even if notification fails', async () => {
  mockPrismaService.recipe.findUnique.mockResolvedValue(mockRecipe);
  mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
  mockPrismaService.comment.create.mockResolvedValue(mockComment);
  // Nếu service dùng try/catch cho notification
  mockNotificationService.createNotification.mockRejectedValue(new Error('WebSocket down'));

  // Tuỳ vào implementation: nếu có try/catch thì vẫn resolve
  await expect(service.create(mockUser.id, mockRecipe.id, { content: 'ok', rating: 5 }))
    .rejects.toThrow(); // hoặc .resolves.toEqual nếu notification được wrap
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case.*
