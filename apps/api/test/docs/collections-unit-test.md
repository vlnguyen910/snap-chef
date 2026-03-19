# Unit Test — Collections Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Collections Module** (`CollectionService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [CollectionService — collection.service.spec.ts](#4-collectionservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/collections/
├── collection.module.ts
├── collection.service.ts         ← business logic
├── collection.service.spec.ts    ← unit test (file này)
├── collection.controller.ts
└── dto/
    ├── create-collection.ts      ← name, description?, is_public?
    └── update-collection.ts      ← name?, description?, is_public?
```

**Dependencies của CollectionService:**

| Dependency       | Vai trò                                             |
| ---------------- | --------------------------------------------------- |
| `PrismaService`  | CRUD trên bảng `collection`                         |
| `UsersService`   | `findOne()` — kiểm tra owner và current user        |
| `RecipesService` | `findOne()` — kiểm tra recipe tồn tại trước khi add |

**Phân quyền:**

| Action                   | Điều kiện                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| Xem danh sách collection | Owner thấy tất cả; người khác / anonymous chỉ thấy `is_public: true` |
| Xem chi tiết collection  | Public: mọi người; Private: chỉ owner                                |
| Add/remove recipe        | Chỉ owner                                                            |
| Cập nhật tên/mô tả       | Chỉ owner                                                            |

---

## 2. Dữ liệu mock dùng chung

```typescript
const mockOwner = {
  id: 'owner-uuid-1',
  username: 'owner',
  email: 'owner@example.com',
};
const mockOtherUser = {
  id: 'other-uuid-1',
  username: 'other',
  email: 'other@example.com',
};
const mockRecipe = {
  id: 'recipe-uuid-1',
  title: 'Test Recipe',
  thumbnail_url: '...',
};

const mockCollection = {
  id: 'collection-uuid-1',
  name: 'My Favorites',
  description: 'Best recipes',
  is_public: true,
  owner_id: 'owner-uuid-1',
};

const mockPrivateCollection = { ...mockCollection, is_public: false };
const mockCollectionWithRecipes = { ...mockCollection, recipe: [mockRecipe] };
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  collection: { create, findMany, findUnique, update },
};

const mockUsersService = { findOne: jest.fn() };
const mockRecipesService = { findOne: jest.fn() };
```

---

## 4. CollectionService

File: `src/modules/collections/collection.service.spec.ts` — **17 test cases**

---

### 4.1 `initialization`

| #   | Test case           | Mô tả                            |
| --- | ------------------- | -------------------------------- |
| 1   | `should be defined` | Service được khởi tạo thành công |

---

### 4.2 `create(user_id, dto: CreateCollectionDto)`

Tạo collection mới. `owner_id` được gán từ `user_id` (JWT), không phải từ DTO.

| #   | Test case                                              | Loại       | Mô tả                                                               |
| --- | ------------------------------------------------------ | ---------- | ------------------------------------------------------------------- |
| 2   | `should create a collection with the correct owner_id` | Happy path | `prisma.collection.create({ data: { ...dto, owner_id: user_id } })` |

---

### 4.3 `getUserCollection(owner_id, current_user_id?)`

Lấy danh sách collection của một user.

**Logic lọc visibility:**

```
isOwner = (owner_id === current_user_id)

prisma.collection.findMany({
  where: {
    owner_id,
    ...(isOwner ? {} : { is_public: true }),  ← chỉ public nếu không phải owner
  }
})
```

| #   | Test case                                                                      | Loại       | Mô tả                                                         |
| --- | ------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------- |
| 3   | `should return all collections (including private) when owner views their own` | Happy path | `where` không có `is_public` filter                           |
| 4   | `should return only public collections when viewed by another user`            | Happy path | `where.is_public: true`                                       |
| 5   | `should return only public collections when not logged in`                     | Edge case  | `current_user_id = undefined` → `where.is_public: true`       |
| 6   | `should throw NotFoundException if owner does not exist`                       | Error path | `usersService.findOne` trả về `null` → throw `USER_NOT_FOUND` |

---

### 4.4 `findOne(id, current_user_id?)`

Lấy chi tiết collection, bao gồm danh sách recipe. Kiểm tra quyền truy cập private collection.

**Logic access control:**

```
collection = prisma.collection.findUnique({ include: { recipe: {...} } })

if (!collection)       → NotFoundException
if (!is_public && current_user_id !== owner_id) → ForbiddenException
return collection
```

| #   | Test case                                                                    | Loại       | Mô tả                                                                             |
| --- | ---------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| 7   | `should return public collection for any user`                               | Happy path | `is_public: true` → trả về kết quả bình thường                                    |
| 8   | `should return private collection when accessed by the owner`                | Happy path | `is_public: false`, `current_user_id === owner_id` → được xem                     |
| 9   | `should throw ForbiddenException if user tries to access private collection` | Error path | `is_public: false`, `current_user_id !== owner_id` → throw `COLLECTION_FORBIDDEN` |
| 10  | `should throw NotFoundException if collection does not exist`                | Error path | Prisma trả về `null` → throw `COLLECTION_NOT_FOUND`                               |

---

### 4.5 `addRecipe(collection_id, recipe_id, user_id)`

Toggle recipe vào/ra collection. Dùng Prisma relation `connect` / `disconnect`.

**Logic toggle:**

```
recipe   = recipeService.findOne(recipe_id)     ← kiểm tra recipe tồn tại
collection = prisma.collection.findUnique()      ← lấy collection + recipe list

if (!collection)                    → NotFoundException
if (collection.owner_id !== user_id) → ForbiddenException

isAlreadyInCollection = collection.recipe.length > 0

prisma.collection.update({ data: { recipe: { connect/disconnect: { id: recipe_id } } } })
return { message: '...' }
```

| #   | Test case                                                         | Loại       | Mô tả                                                                |
| --- | ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| 11  | `should add recipe to collection and return success message`      | Happy path | `recipe = []` → `connect` → message chứa "added to"                  |
| 12  | `should remove recipe from collection and return success message` | Happy path | `recipe = [{ id }]` → `disconnect` → message chứa "removed from"     |
| 13  | `should throw NotFoundException if recipe does not exist`         | Error path | `recipeService.findOne` throw `NotFoundException`                    |
| 14  | `should throw NotFoundException if collection does not exist`     | Error path | `collection.findUnique` trả về `null` → throw `COLLECTION_NOT_FOUND` |
| 15  | `should throw ForbiddenException if user is not the owner`        | Error path | `collection.owner_id !== user_id` → throw `NO_RIGHT_EDIT_COLLECTION` |

---

### 4.6 `update(collection_id, payload, user_id)`

Cập nhật thông tin collection. Gọi `findOne()` trước để xác nhận tồn tại và quyền sở hữu.

**Lưu ý:** `findOne()` đã kiểm tra tất cả guard conditions — nếu collection là private và user không phải owner, `findOne()` sẽ throw `ForbiddenException` trước khi đến bước update.

| #   | Test case                                                     | Loại       | Mô tả                                                                         |
| --- | ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| 16  | `should update collection and return updated data`            | Happy path | Owner cập nhật → `prisma.collection.update({ where: { id }, data: payload })` |
| 17  | `should throw ForbiddenException if user is not the owner`    | Error path | `findOne()` detect mismatch → throw `ForbiddenException`                      |
| 18  | `should throw NotFoundException if collection does not exist` | Error path | `collection.findUnique` → `null` → throw `NotFoundException`                  |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       17 passed, 0 failed
```

```bash
cd apps/api
pnpm run test --testPathPattern="collection.service" --coverage \
  --collectCoverageFrom="**/modules/collections/collection.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test visibility khi current user cũng được check

```typescript
it('should throw NotFoundException if current_user_id is invalid', async () => {
  mockUsersService.findOne
    .mockResolvedValueOnce(mockOwner) // owner tồn tại
    .mockResolvedValueOnce(null); // current user không tồn tại

  await expect(
    service.getUserCollection(mockOwner.id, 'ghost-user'),
  ).rejects.toThrow(new NotFoundException(ErrorMessages.USER_NOT_FOUND));
});
```

### Thêm test add recipe khi cùng recipe được add nhiều lần (idempotent)

```typescript
it('should return "removed from" on second add (toggle behavior)', async () => {
  // Lần 1: add (recipe chưa có)
  mockPrismaService.collection.findUnique.mockResolvedValue({
    ...mockCollection,
    recipe: [],
  });
  mockRecipesService.findOne.mockResolvedValue(mockRecipe);
  const result1 = await service.addRecipe(
    mockCollection.id,
    mockRecipe.id,
    mockOwner.id,
  );
  expect(result1.message).toContain('added to');

  // Lần 2: remove (recipe đã có)
  mockPrismaService.collection.findUnique.mockResolvedValue({
    ...mockCollection,
    recipe: [{ id: mockRecipe.id }],
  });
  const result2 = await service.addRecipe(
    mockCollection.id,
    mockRecipe.id,
    mockOwner.id,
  );
  expect(result2.message).toContain('removed from');
});
```

---

_Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case._
