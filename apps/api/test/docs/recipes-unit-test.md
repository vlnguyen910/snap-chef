# Unit Test — Recipes Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Recipes Module** (`RecipesService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [Ghi chú kỹ thuật — mock `$transaction`](#4-ghi-chú-kỹ-thuật--mock-transaction)
5. [RecipesService — recipes.service.spec.ts](#5-recipesservice)
6. [Coverage hiện tại](#6-coverage-hiện-tại)
7. [Hướng dẫn mở rộng test](#7-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/recipes/
├── recipes.module.ts
├── recipes.service.ts         ← business logic
├── recipes.service.spec.ts    ← unit test (file này)
├── recipes.controller.ts      ← HTTP handler
└── dto/
    ├── create-recipe.dto.ts
    ├── update-recipe.dto.ts
    └── recipe-detail.dto.ts
```

**Dependencies của RecipesService:**

| Dependency | Vai trò |
|---|---|
| `PrismaService` | DB operations: recipe, step, ingredient, like, `$transaction` |
| `IngredientsService` | `upsertByName()` — tạo hoặc lấy ingredient theo tên |
| `UsersService` | `findOne()` — xác nhận user tồn tại |
| `RedisService` | Cache từng recipe theo `recipe:{id}` với TTL 10 phút |
| `NotificationService` | Gửi notification LIKE khi user like recipe |

**Enums liên quan:**

| Enum | Giá trị |
|---|---|
| `RecipeStatus` | `DRAFT`, `PUBLISHED` |
| `NotificationType` | `LIKE`, `COMMENT`, `FOLLOW` |
| `NotificationResourceType` | `RECIPE`, `USER`, `COMMENT` |

---

## 2. Dữ liệu mock dùng chung

```typescript
const mockAuthor = { id: 'author-uuid-1', username: 'author', email: 'author@example.com' };
const mockUser   = { id: 'user-uuid-1', username: 'testuser', email: 'test@example.com' };

const mockRecipe = {
  id:            'recipe-uuid-1',
  title:         'Test Recipe',
  description:   'A delicious test recipe',
  author_id:     'author-uuid-1',
  cooking_time:  30,
  servings:      4,
  thumbnail_url: 'https://example.com/thumb.jpg',
  status:        RecipeStatus.DRAFT,
  deleted_at:    null,
  steps:         [{ order_index: 1, content: 'Step 1', image_url: null }],
  user:          { username: 'author', avatar_url: null },
  ingredients:   [],
};

// Dùng cho findAll() và getUserRecipes()
const mockRecipeWithCount = {
  ...mockRecipe,
  _count: { comments: 5, likes: 10 },
};
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  $transaction:      jest.fn(),
  recipe:            { create, findMany, findUnique, update },
  recipeIngredient:  { create, deleteMany },
  step:              { deleteMany, createMany },
  like:              { findUnique, create, delete },
};

const mockIngredientsService = { upsertByName: jest.fn() };
const mockUsersService       = { findOne: jest.fn() };
const mockRedisService       = { getCache, setCache, delCache };
const mockNotificationService = { createNotification: jest.fn() };
```

---

## 4. Ghi chú kỹ thuật — mock `$transaction`

> [!IMPORTANT]
> `RecipesService.create()` và `RecipesService.update()` chạy trong **Prisma transaction** bằng `this.prisma.$transaction(async (tx) => { ... })`. Callback nhận `tx` thay vì `this.prisma` trực tiếp.

**Cách mock:** Cho `$transaction` gọi callback ngay lập tức với chính `mockPrismaService`:

```typescript
const mockTransaction = jest.fn((cb: (tx: any) => Promise<any>) => cb(mockPrismaService));

const mockPrismaService = {
  $transaction: mockTransaction,
  recipe: { ... },
  // ...
};
```

Nhờ đó, bên trong callback của transaction, `tx.recipe.create(...)` thực ra là `mockPrismaService.recipe.create(...)` — ta có thể spy và assert bình thường.

---

## 5. RecipesService

File: `src/modules/recipes/recipes.service.spec.ts` — **27 test cases**

---

### 5.1 `initialization`

| # | Test case | Mô tả |
|---|---|---|
| 1 | `should be defined` | NestJS inject đủ dependencies và khởi tạo service thành công |

---

### 5.2 `create(user_id, dto: CreateRecipeDto)`

Tạo recipe mới bên trong một Prisma transaction. Gồm 3 bước: tạo recipe + steps, upsert từng ingredient, tạo RecipeIngredient.

**Luồng:**
```
1. usersService.findOne(user_id)          → kiểm tra user tồn tại
2. validateOrderIndices(dto.steps)        → validate thứ tự steps
3. prisma.$transaction():
   a. recipe.create(...)                  → tạo recipe + steps trong 1 câu lệnh
   b. for each ingredient:
      - ingredientsService.upsertByName() → tìm hoặc tạo ingredient
      - recipeIngredient.create()         → gắn vào recipe
```

**`validateOrderIndices()` — private method, được test gián tiếp qua `create()`:**

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 2 | `should create a recipe with steps and ingredients in a transaction` | Happy path | Tất cả hợp lệ → `$transaction` và `recipe.create` được gọi, trả về `{ recipe, ingredients }` |
| 3 | `should throw BadRequestException if user does not exist` | Error path | `usersService.findOne` trả về `null` → throw `USER_NOT_FOUND`, `$transaction` **không** được gọi |
| 4 | `should throw BadRequestException if steps array is empty` | Validation | Không có step nào → throw `AT_LEAST_ONE_STEP` |
| 5 | `should throw BadRequestException if order_index does not start from 1` | Validation | Step đầu tiên có `order_index = 2` → throw `ORDER_INDEX_START_FROM_1` |
| 6 | `should throw BadRequestException if order indices are duplicated` | Validation | Hai step cùng `order_index = 1` → throw `DUPLICATE_ORDER_INDEX` |
| 7 | `should throw BadRequestException if order indices are not continuous` | Validation | Steps có index `[1, 3]` (bỏ qua 2) → throw `ORDER_INDEX_CONTINUOUS` |

---

### 5.3 `findAll(params)`

Lấy danh sách recipe với pagination và search. Map `_count` thành các count field riêng.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 8 | `should return mapped recipes with counts` | Happy path | `_count` bị xóa, thay bằng `comments_count: 5` và `likes_count: 10` |
| 9 | `should apply correct skip and take for pagination` | Happy path | `page:3, limit:5` → `skip: 10, take: 5` được truyền vào Prisma |
| 10 | `should include search filter in where condition` | Happy path | `search: 'pasta'` → `where.OR[0]` chứa `title: { contains: 'pasta', mode: 'insensitive' }` |
| 11 | `should return empty array when no recipes exist` | Edge case | Prisma trả về `[]` → service trả về `[]` |

---

### 5.4 `findOne(id, user_id?)`

Lấy chi tiết một recipe theo ID. Dùng Redis cache. Kèm trường `is_liked` nếu có `user_id`.

**Cơ chế cache:**
```
Redis.getCache('recipe:{id}')
  ├── HIT  → dùng cache, bỏ qua DB
  └── MISS → prisma.recipe.findUnique()
              → Redis.setCache('recipe:{id}', data, 10)

→ nếu có user_id: checkUserLiked() → like.findUnique()
→ trả về { ...recipeData, is_liked }
```

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 12 | `should return cached recipe without hitting the database` | Cache hit | Redis có data → `prisma.recipe.findUnique` **không** được gọi |
| 13 | `should fetch from DB and cache when cache is empty` | Cache miss | Redis `null` → query DB → `redis.setCache` với key `recipe:{id}`, TTL 10 |
| 14 | `should throw NotFoundException if recipe is not found` | Error path | Cache miss + DB `null` → throw `RECIPE_NOT_FOUND` |
| 15 | `should include is_liked=true if user has liked the recipe` | Happy path | `like.findUnique` trả về record → `is_liked: true` |

---

### 5.5 `update(id, user_id, dto: UpdateRecipeDto)`

Cập nhật recipe bên trong Prisma transaction. Kiểm tra quyền author. Hỗ trợ cập nhật ingredients và/hoặc steps (xóa cũ, tạo mới).

**Luồng:**
```
1. findOne(id)                → lấy recipe (qua cache), kiểm tra tồn tại
2. kiểm tra author_id === user_id
3. redis.delCache('recipe:{id}')
4. prisma.$transaction():
   a. recipe.update(scalarFields)
   b. nếu có ingredients: deleteMany() → upsertByName() × n → create() × n
   c. nếu có steps: step.deleteMany() → step.createMany()
   d. recipe.findUnique() → return kết quả cuối
```

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 16 | `should update scalar fields and return updated recipe` | Happy path | Chỉ cập nhật `title` → cache bị xóa, `recipe.update` được gọi, trả về recipe mới |
| 17 | `should replace all ingredients when provided` | Happy path | `recipeIngredient.deleteMany` xóa hết cũ → `upsertByName` + tạo mới từng ingredient |
| 18 | `should replace all steps when provided` | Happy path | `step.deleteMany` xóa hết cũ → `step.createMany` tạo mới tất cả |
| 19 | `should throw NotFoundException if recipe does not exist` | Error path | Cache miss + DB `null` → throw `RECIPE_NOT_FOUND` |
| 20 | `should throw UnauthorizedException if user is not the author` | Error path | `recipe.author_id !== user_id` → throw `NO_PERMISSION` |

---

### 5.6 `likeRecipe(user_id, recipe_id)`

Toggle like / unlike recipe. Gửi notification LIKE đến author khi like. Không gửi khi unlike.

**Logic toggle:**
```
checkUserLiked(user_id, recipe_id)
  ├── đã like → like.delete() → return { is_liked: false }  (không gửi notification)
  └── chưa like → like.create()
               → notificationService.createNotification({ type: LIKE })
               → return { is_liked: true }
```

**Bảo vệ:** User không thể like recipe của chính mình.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 21 | `should create like and return is_liked=true` | Happy path | Chưa like → `like.create` được gọi 1 lần → `{ is_liked: true }` |
| 22 | `should send LIKE notification to recipe author` | Happy path | `notificationService.createNotification` được gọi với `type: LIKE`, `receiverId: author_id`, `senderId: user_id`, `resourceType: RECIPE` |
| 23 | `should delete like and return is_liked=false (unlike)` | Happy path | Đã like → `like.delete` được gọi → `{ is_liked: false }`, notification **không** được gửi |
| 24 | `should throw BadRequestException if user does not exist` | Error path | `usersService.findOne` trả về `null` → throw `USER_NOT_FOUND` |
| 25 | `should throw NotFoundException if recipe does not exist` | Error path | `recipe.findUnique` trả về `null` → throw `RECIPE_NOT_FOUND` |
| 26 | `should throw BadRequestException if user tries to like their own recipe` | Error path | `recipe.author_id === user_id` → throw `CANNOT_LIKE_OWN_RECIPE` |

---

### 5.7 `getUserRecipes(user_id)`

Lấy tất cả recipe của một user, kèm like/comment count.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 27 | `should return all recipes for a user with mapped counts` | Happy path | `_count` được map thành `comments_count` và `likes_count`. `where: { author_id }` đúng |
| 28 | `should return empty array if user has no recipes` | Edge case | Prisma trả về `[]` → service trả về `[]` |

---

## 6. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       27 passed, 0 failed
```

Chạy lệnh sau để xem coverage chi tiết:

```bash
cd apps/api
pnpm run test --testPathPattern="recipes.service" --coverage \
  --collectCoverageFrom="**/modules/recipes/recipes.service.ts"
```

---

## 7. Hướng dẫn mở rộng test

### Thêm test `delete()` khi service có soft delete

```typescript
it('should soft delete recipe by setting deleted_at', async () => {
  mockRedisService.getCache.mockResolvedValue(recipeData); // author_id match
  mockPrismaService.like.findUnique.mockResolvedValue(null);
  mockPrismaService.recipe.update.mockResolvedValue({ ...mockRecipe, deleted_at: new Date() });

  const result = await service.delete(mockRecipe.id, mockAuthor.id);

  expect(mockPrismaService.recipe.update).toHaveBeenCalledWith({
    where: { id: mockRecipe.id },
    data: { deleted_at: expect.any(Date) },
  });
  expect(mockRedisService.delCache).toHaveBeenCalledWith(`recipe:${mockRecipe.id}`);
});
```

### Thêm test cho `create()` khi ingredient upsert thất bại

```typescript
it('should rollback transaction if ingredient upsert fails', async () => {
  mockUsersService.findOne.mockResolvedValue(mockAuthor);
  mockIngredientsService.upsertByName.mockRejectedValue(new Error('DB constraint'));

  await expect(service.create(mockAuthor.id, validDto)).rejects.toThrow('DB constraint');
  // Toàn bộ transaction được rollback bởi Prisma
});
```

### Thêm test khi cache bị corrupted (thiếu field)

```typescript
it('should safely sanitize user fields from potentially malformed cache', async () => {
  // Cache có thêm field nhạy cảm (giả sử cache bị write sai)
  const corruptedCache = { ...recipeData, user: { username: 'x', avatar_url: null, email: 'secret' } };
  mockRedisService.getCache.mockResolvedValue(corruptedCache);
  mockPrismaService.like.findUnique.mockResolvedValue(null);

  const result = await service.findOne(mockRecipe.id);

  // Service phải sanitize — chỉ giữ username và avatar_url
  expect(result.user).not.toHaveProperty('email');
  expect(result.user).toHaveProperty('username');
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case.*
