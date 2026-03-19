# Unit Test — Categories Module

Tài liệu mô tả chi tiết các test case đã được viết cho **Categories Module** (`CategoriesService`).

> Xem hướng dẫn tổng quan về cách viết unit test tại [`docs/unit-testing-guide.md`](../../docs/unit-testing-guide.md).

---

## Mục lục

1. [Tổng quan kiến trúc module](#1-tổng-quan-kiến-trúc-module)
2. [Thiết lập mock](#2-thiết-lập-mock)
3. [CategoriesService — categories.service.spec.ts](#3-categoriesservice)
4. [Coverage hiện tại](#4-coverage-hiện-tại)

---

## 1. Tổng quan kiến trúc module

```
src/modules/categories/
├── categories.module.ts
├── categories.service.ts         ← business logic
├── categories.service.spec.ts    ← unit test (file này)
├── categories.controller.ts
└── dto/
    ├── create-category.dto.ts    ← name, is_active?
    └── update-category.dto.ts    ← name?, is_active?
```

**Dependencies của CategoriesService:**

| Dependency             | Vai trò                          |
| ---------------------- | -------------------------------- |
| `PrismaService`        | CRUD trên bảng `category`        |
| `generateSlug` (utils) | Tạo slug tự động từ tên category |

---

## 2. Thiết lập mock

```typescript
// Mock generateSlug (từ src/common/utils/slugify.util)
// LƯU Ý: generateSlug là hàm đồng bộ → dùng mockReturnValue, KHÔNG dùng mockResolvedValue
jest.mock('src/common/utils/slugify.util', () => ({
  generateSlug: jest.fn(),
}));

// Mock PrismaService
const mockPrismaService = {
  category: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};
```

> [!IMPORTANT]
> `generateSlug` là hàm **đồng bộ** (synchronous). Khi mock, phải dùng `mockReturnValue()` thay vì `mockResolvedValue()`. Dùng sai sẽ khiến slug trở thành `Promise {}` thay vì string.

---

## 3. CategoriesService

File: `src/modules/categories/categories.service.spec.ts` — **10 test cases**

> Ngoài ra, `categories.controller.spec.ts` có **1 test case** kiểm tra controller được khởi tạo thành công (đã mock `PrismaService`).

---

### 3.1 `initialization`

| #   | Test case           | Mô tả                            |
| --- | ------------------- | -------------------------------- |
| 1   | `should be defined` | Service được khởi tạo thành công |

---

### 3.2 `create(payload: CreateCategoryDto)`

Tạo category mới. `slug` được generate tự động từ `name` và kiểm tra trùng lặp.

| #   | Test case                                               | Loại       | Mô tả                                                                                                                 |
| --- | ------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 2   | `should successfully create a new category`             | Happy path | Tạo thành công khi slug chưa tồn tại. `generateSlug` được gọi, `prisma.category.create` được thực thi và trả về data. |
| 3   | `should throw ConflictException if slug already exists` | Error path | `prisma.category.findFirst` trả về data cũ → throw `ConflictException` (`ErrorMessages.CATEGORY_ALREADY_EXISTS`).     |

---

### 3.3 `findAll(isActiveOnly: boolean = true)`

Lấy danh sách các category, mặc định chỉ lấy category đang hoạt động (`is_active: true`) và sắp xếp theo `name` tăng dần.

| #   | Test case                                                                 | Loại       | Mô tả                                                                                                           |
| --- | ------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| 4   | `should return all active categories when isActiveOnly is true (default)` | Happy path | `isActiveOnly` mặc định → gọi `prisma.category.findMany` với filter `{ is_active: true }`                       |
| 5   | `should return all categories when isActiveOnly is false`                 | Happy path | Truyền `isActiveOnly = false` → gọi `prisma.category.findMany` với filter `{}` (không có điều kiện `is_active`) |

---

### 3.4 `update(id: number, payload: UpdateCategoryDto)`

Cập nhật thông tin category. Nếu có trường `name` trong `payload`, system sẽ tự động generate ra `slug` mới và kiểm tra xem có bị trùng với category khác không.

| #   | Test case                                                               | Loại       | Mô tả                                                                                                                                                    |
| --- | ----------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | `should throw NotFoundException if category does not exist`             | Error path | Gọi `prisma.category.findUnique` trả về `null` → throw `NotFoundException` (`ErrorMessages.CATEGORY_NOT_FOUND`)                                          |
| 7   | `should successfully update a category without name payload`            | Happy path | Cập nhật các trường không ảnh hưởng đến slug (như `is_active`) → không check trùng slug → thực thi update thành công                                     |
| 8   | `should successfully update a category with new name and slug`          | Happy path | Update có `name` → tạo slug mới bằng `generateSlug` → check `findFirst` không trùng → thực thi update thành công với `slug` mới                          |
| 9   | `should successfully update a category with the same name`              | Happy path | Update bằng chính tên ban đầu → tạo lại đúng `slug` cũ → check `findFirst` (`{ slug, id: { not: id } }`) không vướng record **khác** → update thành công |
| 10  | `should throw ConflictException if new name generates a duplicate slug` | Error path | Update có `name` → tạo slug mới → `findFirst` phát hiện trùng với record khác → throw `ConflictException` (`ErrorMessages.CATEGORY_DUPLICATED`)          |

---

## 4. Coverage hiện tại

```
Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

```bash
cd apps/api
pnpm run test categories.service.spec.ts --coverage --collectCoverageFrom="**/modules/categories/categories.service.ts"
```

| File                  | % Stmts | % Branch | % Funcs | % Lines |
| --------------------- | ------- | -------- | ------- | ------- |
| categories.service.ts | 100     | 93.33    | 100     | 100     |

---

_Tài liệu cập nhật lần cuối: **2026-03-06**. Cập nhật khi thêm hoặc thay đổi test case._
