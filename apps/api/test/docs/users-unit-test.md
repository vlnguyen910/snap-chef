# Unit Test — Users Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Users Module** (`UsersService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [UsersService — users.service.spec.ts](#4-usersservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/users/
├── users.module.ts
├── users.service.ts         ← business logic
├── users.service.spec.ts    ← unit test (file này)
├── users.controller.ts      ← HTTP handler
└── dto/
    ├── create-user.dto.ts
    └── update-user.dto.ts
```

**Dependencies của UsersService:**

| Dependency | Vai trò |
|---|---|
| `PrismaService` | Truy vấn DB (user, follow, like) |
| `RedisService` | Cache user theo `user:{id}` với TTL 60 phút |
| `NotificationService` | Gửi notification FOLLOW khi user follow nhau |

---

## 2. Dữ liệu mock dùng chung

```typescript
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

const mockUser2 = { ...mockUser, id: 'user-uuid-2', email: 'other@example.com', username: 'otheruser' };
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  user:   { create, findMany, findUnique, findFirst, update },
  follow: { findUnique, create, delete, findMany },
  like:   { findMany },
};

const mockRedisService = {
  getCache: jest.fn(),
  setCache:  jest.fn(),
  delCache:  jest.fn(),
};

const mockNotificationService = {
  createNotification: jest.fn(),
};
```

> **Chiến lược cache:** Phần lớn các method đọc user đều đi qua `findOne()` — method này check Redis trước. Trong test, ta mock `redis.getCache` trực tiếp để kiểm soát cache hit/miss.

---

## 4. UsersService

File: `src/modules/users/users.service.spec.ts` — **22 test cases**

---

### 4.1 `initialization`

| # | Test case | Mô tả |
|---|---|---|
| 1 | `should be defined` | NestJS inject đủ dependencies và khởi tạo service thành công |

---

### 4.2 `create(payload: CreateUserDto)`

Tạo user mới trong database.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 2 | `should create and return a new user` | Happy path | `prisma.user.create({ data: { ...payload } })` được gọi đúng → trả về user |

---

### 4.3 `findOne(id: string)`

Tìm user theo ID. Ưu tiên dùng Redis cache trước khi query DB.

**Cơ chế cache:**
```
Redis.getCache('user:{id}')
  ├── HIT  → return user (không query DB)
  └── MISS → prisma.user.findUnique()
              → Redis.setCache('user:{id}', user, 60)
              → return user
```

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 3 | `should return cached user without hitting the database` | Cache hit | Redis trả về user → `prisma.user.findUnique` **không** được gọi |
| 4 | `should fetch from DB and cache when cache is empty` | Cache miss | Redis trả về `null` → query DB → `redis.setCache` với TTL 60 phút |
| 5 | `should return null if user does not exist` | Edge case | Redis `null` + DB `null` → return `null` (không throw) |

---

### 4.4 `findByEmail(email: string)`

Tìm user theo email, dùng trong quá trình xác thực.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 6 | `should return user when found by email` | Happy path | `prisma.user.findFirst({ where: { email } })` trả về user |
| 7 | `should return null when user is not found by email` | Edge case | Prisma trả về `null` → service trả về `null` |

---

### 4.5 `update(id, user_id, payload: UpdateUserDto)`

Cập nhật thông tin user. Kiểm tra quyền sở hữu trước khi update.

**Luồng:**
1. `findOne(id)` — lấy user (qua cache)
2. Nếu không có → `NotFoundException`
3. Nếu `user.id !== user_id` → `UnauthorizedException`
4. `redis.delCache('user:{id}')` — xóa cache cũ
5. `prisma.user.update()` — cập nhật DB

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 8 | `should update user and clear cache` | Happy path | `id === user_id` → update thành công, `redis.delCache` được gọi với đúng key |
| 9 | `should throw NotFoundException if user does not exist` | Error path | `findOne` trả về `null` → throw `USER_NOT_FOUND` |
| 10 | `should throw UnauthorizedException if user_id does not match` | Error path | `user.id !== user_id` → throw `NO_PERMISSION` — ngăn user A sửa profile user B |

---

### 4.6 `followUser(current_id, following_id)`

Toggle follow / unfollow. Gửi notification FOLLOW sau khi thực hiện.

**Logic toggle:**
```
prisma.follow.findUnique()
  ├── null     → prisma.follow.create()  → isFollowed = true
  └── có data  → prisma.follow.delete()  → isFollowed = false

→ notificationService.createNotification({ type: FOLLOW })
```

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 11 | `should create follow relation and return followed message` | Happy path | `follow.findUnique` trả về `null` → `follow.create` được gọi → message "followed" |
| 12 | `should delete follow relation and return unfollowed message` | Happy path | `follow.findUnique` trả về record → `follow.delete` được gọi → message "unfollowed" |
| 13 | `should create a FOLLOW notification` | Happy path | `notificationService.createNotification` được gọi với `type: FOLLOW`, `receiverId: following_id`, `senderId: current_id` |
| 14 | `should throw NotFoundException if either user is not found` | Error path | Một trong hai user không tồn tại → throw `USER_NOT_FOUND` |

---

### 4.7 `getLikedRecipes(user_id)`

Lấy danh sách recipe mà user đã like.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 15 | `should return liked recipes for the user` | Happy path | `prisma.like.findMany({ where: { user_id }, select: { recipe: true } })` trả về danh sách |
| 16 | `should throw NotFoundException if user is not found` | Error path | `findOne` trả về `null` → throw `USER_NOT_FOUND` |

---

### 4.8 `getCurrentProfile(user_id)`

Lấy profile đầy đủ của user đang đăng nhập, bao gồm followers/following/recipe count.

**Lưu ý**: `password` và `_count` được loại khỏi response. Thay vào đó, các count được flatten ra thành field riêng.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 17 | `should return profile with counts and without password` | Happy path | `_count` được map thành `followers_count`, `following_count`, `recipes_count`. `password` không có trong response |
| 18 | `should throw NotFoundException if user is not found` | Error path | Prisma trả về `null` → throw `USER_NOT_FOUND` |

---

### 4.9 `getPublicProfile(target_id, current_id?)`

Lấy profile public của một user. Thêm trường `is_followed` dựa trên quan hệ follow của current user.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 19 | `should return is_followed=true if current user follows target` | Happy path | `follow.findUnique` trả về record → `is_followed: true`. `email` và `role` bị loại khỏi response |
| 20 | `should return is_followed=false if not following` | Happy path | `follow.findUnique` trả về `null` → `is_followed: false` |
| 21 | `should return is_followed=false when not logged in` | Edge case | `current_id = undefined` → không gọi `prisma.follow.findUnique`, trả về `is_followed: false` |

---

### 4.10 `findAll(query, current_user_id?)`

Lấy danh sách user với pagination. Loại current user khỏi kết quả.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 22 | `should return list of users excluding current user` | Happy path | `where` có `id: { not: current_user_id }` |
| 23 | `should not exclude any user if not logged in` | Edge case | `current_user_id = undefined` → `where.id` không được set |

---

### 4.11 `getBlockedUserIds(user_id)`

Lấy danh sách ID của các user đã block hoặc bị block bởi user hiện tại.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 24 | `should return a list of unique blocked user ids` | Happy path | `prisma.block.findMany` trả về danh sách, service map và trả về array các ID duy nhất |

---

### 4.12 `blockUser(current_id, target_id)`

Block một user. Xóa mọi quan hệ follow giữa 2 user.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 25 | `should block a user and remove follows` | Happy path | `prisma.block.create` và `prisma.follow.deleteMany` được gọi thành công |

---

### 4.13 `unblockUser(current_id, target_id)`

Unblock một user.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 26 | `should unblock a user successfully` | Happy path | `prisma.block.delete` được gọi thành công |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       26 passed, 0 failed
```

Chạy lệnh sau để xem coverage chi tiết:

```bash
cd apps/api
pnpm run test --testPathPattern="users.service" --coverage \
  --collectCoverageFrom="**/modules/users/users.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test cho `getFollowers()` / `getFollowing()`

```typescript
describe('getFollowers()', () => {
  it('should return list of followers with is_following field', async () => {
    mockRedisService.getCache.mockResolvedValue(mockUser); // profile user
    mockPrismaService.follow.findMany.mockResolvedValue([
      { follower: { id: 'f1', username: 'follower1', avatar_url: '', followedBy: [] } },
    ]);

    const result = await service.getFollowers(mockUser.id, undefined, { page: 1, limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('is_following', false);
    expect(result[0]).not.toHaveProperty('followedBy');
  });
});
```

### Thêm test pagination cho `findAll()`

```typescript
it('should apply correct skip based on page number', async () => {
  mockPrismaService.user.findMany.mockResolvedValue([]);

  await service.findAll({ page: 3, limit: 5 }, undefined);

  expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 10, take: 5 }),
  );
});
```

### Thêm test search trong `findAll()`

```typescript
it('should add search filter to whereCondition', async () => {
  mockPrismaService.user.findMany.mockResolvedValue([]);

  await service.findAll({ page: 1, limit: 10, search: 'john' }, undefined);

  const args = mockPrismaService.user.findMany.mock.calls[0][0];
  expect(args.where.OR[0]).toMatchObject({
    username: { contains: 'john', mode: 'insensitive' },
  });
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case.*
