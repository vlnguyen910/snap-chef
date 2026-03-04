# Unit Test — Ingredients Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Ingredients Module** (`IngredientsService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Dữ liệu mock dùng chung](#2-dữ-liệu-mock-dùng-chung)
3. [Thiết lập mock](#3-thiết-lập-mock)
4. [IngredientsService — ingredients.service.spec.ts](#4-ingredientsservice)
5. [Coverage hiện tại](#5-coverage-hiện-tại)
6. [Hướng dẫn mở rộng test](#6-hướng-dẫn-mở-rộng-test)

---

## 1. Tổng quan kiến trúc module

```
src/modules/ingredients/
├── ingredients.module.ts
├── ingredients.service.ts         ← business logic
├── ingredients.service.spec.ts    ← unit test (file này)
├── ingredients.controller.ts
└── dto/
    ├── create-ingredient.dto.ts   ← name: string
    └── update-ingredient.dto.ts
```

**Vai trò của IngredientsService:**

`IngredientsService` chủ yếu được dùng **bên trong `RecipesService`** — không phải từ HTTP request trực tiếp. Method quan trọng nhất là `upsertByName()` vì nó cho phép tạo ingredient nếu chưa tồn tại hoặc lấy lại nếu đã có, giúp tránh duplicate.

**Dependencies:**

| Dependency | Vai trò |
|---|---|
| `PrismaService` | Truy vấn bảng `ingredient` |

---

## 2. Dữ liệu mock dùng chung

```typescript
const mockIngredient = {
  id:         'ingredient-uuid-1',
  name:       'tomato',
  created_at: new Date(),
};
```

---

## 3. Thiết lập mock

```typescript
const mockPrismaService = {
  ingredient: {
    create:    jest.fn(),
    findFirst: jest.fn(),
    upsert:    jest.fn(),
  },
};
```

---

## 4. IngredientsService

File: `src/modules/ingredients/ingredients.service.spec.ts` — **8 test cases**

---

### 4.1 `initialization`

| # | Test case | Mô tả |
|---|---|---|
| 1 | `should be defined` | NestJS khởi tạo service thành công |

---

### 4.2 `create(dto: CreateIngredientDto)`

Tạo ingredient mới. Tên được **normalize** (trim + toLowerCase) trước khi lưu.

> **Tại sao normalize?** Tránh duplicate do khác biệt spacing hoặc case: `"Tomato"`, `"  tomato  "`, `"TOMATO"` đều phải trở thành `"tomato"`.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 2 | `should create ingredient with trimmed and lowercased name` | Happy path | `'  Tomato  '` → `prisma.ingredient.create({ data: { name: 'tomato' } })` |
| 3 | `should normalize uppercase names to lowercase` | Happy path | `'BASIL'` → `{ name: 'basil' }` |

---

### 4.3 `findOneByName(name: string)`

Tìm ingredient theo tên chính xác trong DB.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 4 | `should return ingredient when found by name` | Happy path | `prisma.ingredient.findFirst({ where: { name: 'tomato' } })` |
| 5 | `should return null when ingredient is not found` | Edge case | Prisma trả về `null` → service trả về `null` |

---

### 4.4 `upsertByName(name: string, tx?)`

Tìm hoặc tạo ingredient theo tên. Normalize tên. Nhận tùy chọn `tx` (Prisma Transaction Client) để chạy trong transaction của `RecipesService`.

**Behavior:**
```
cleanName = name.trim().toLowerCase()

client.ingredient.upsert({
  where:  { name: cleanName },
  update: {},               ← nếu đã có → không thay đổi gì
  create: { name: cleanName }  ← nếu chưa có → tạo mới
})
```

> **Tại sao dùng `tx`?** `RecipesService.create()` và `RecipesService.update()` chạy toàn bộ trong một Prisma transaction. `upsertByName(name, tx)` cần dùng cùng transaction client, nếu không ingredient được tạo sẽ không được rollback khi transaction fail.

| # | Test case | Loại | Mô tả |
|---|---|---|---|
| 6 | `should upsert ingredient with normalized name` | Happy path | `'  Tomato  '` → `upsert({ where: { name: 'tomato' }, update: {}, create: { name: 'tomato' } })` |
| 7 | `should use the provided transaction client when tx is passed` | Integration | `tx.ingredient.upsert` được gọi, `this.prisma.ingredient.upsert` **không** được gọi |
| 8 | `should use this.prisma when no transaction client is provided` | Happy path | `tx = undefined` → `this.prisma.ingredient.upsert` được gọi 1 lần |

---

## 5. Coverage hiện tại

```
Test Suites: 1 passed
Tests:       8 passed, 0 failed
```

```bash
cd apps/api
pnpm run test --testPathPattern="ingredients.service" --coverage \
  --collectCoverageFrom="**/modules/ingredients/ingredients.service.ts"
```

---

## 6. Hướng dẫn mở rộng test

### Thêm test `upsertByName` khi upsert DB thất bại

```typescript
it('should propagate DB error from upsert', async () => {
  mockPrismaService.ingredient.upsert.mockRejectedValue(new Error('Unique constraint failed'));

  await expect(service.upsertByName('tomato')).rejects.toThrow('Unique constraint failed');
});
```

### Thêm test `create` khi tên bị trùng (DB constraint)

```typescript
it('should propagate error if ingredient name already exists', async () => {
  mockPrismaService.ingredient.create.mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0' }),
  );

  await expect(service.create({ name: 'tomato' })).rejects.toThrow();
});
```

---

*Tài liệu cập nhật lần cuối: **2026-03-04**. Cập nhật khi thêm hoặc thay đổi test case.*
