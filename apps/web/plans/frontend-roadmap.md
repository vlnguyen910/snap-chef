# 🗺️ Kế hoạch & Lộ trình Phát triển Frontend — Snap Chef

> **Mục tiêu:** Tiếp tục phát triển frontend trên codebase hiện tại, refactor code cũ, hoàn thiện các tính năng còn thiếu, và nâng cấp UI/UX.
> **Ngày tạo:** 2026-03-13

---

## 📊 Phân tích hiện trạng Frontend

### Đã có (kế thừa từ thành viên cũ)

| Hạng mục          | Số lượng | Ghi chú                                     |
| ----------------- | -------- | ------------------------------------------- |
| Pages             | 14       | 3 page > 24KB cần tách nhỏ                  |
| Feature modules   | 3        | `auth`, `recipes`, `moderation`             |
| Common components | 14       | Một số file lớn (UserProfile 26KB)          |
| Layout components | 4        | Header, MainLayout, Sidebar, UserMenu       |
| Services (API)    | 5        | Thiếu nhiều services cho các module backend |
| Hooks             | 5        | Chủ yếu phục vụ recipes                     |
| UI components     | 2        | Chỉ có `Button` và `Toaster`                |

### Thiếu (so với Backend API)

| Backend Module  | Frontend Service | Frontend UI                       |
| --------------- | ---------------- | --------------------------------- |
| `notifications` | ❌ Chưa có       | ❌ Chưa có                        |
| `collections`   | ❌ Chưa có       | ❌ Chưa có                        |
| `categories`    | ❌ Chưa có       | ❌ Chưa có (filter chưa dùng API) |
| `feed`          | ❌ Chưa có       | ❌ Chưa có (HomePage static)      |
| `reports`       | ❌ Chưa có       | ❌ Chưa có                        |
| `ingredients`   | ❌ Chưa có       | ❌ Chưa có (autocomplete)         |
| `admin`         | ❌ Chưa có       | ❌ Chưa có (admin dashboard)      |

---

## 🚀 Lộ trình phát triển (4 Phases)

### Phase 1: 🔧 Refactor & Cải thiện Nền tảng (ưu tiên cao nhất)

> **Mục tiêu:** Cải thiện code quality, tách nhỏ components, xây dựng UI component library.

#### 1.1. Refactor các Pages lớn

| File                   | Size | Hành động                                                            |
| ---------------------- | ---- | -------------------------------------------------------------------- |
| `CreateRecipePage.tsx` | 25KB | Tách → `RecipeForm`, `IngredientInput`, `StepEditor`, `ImageUpload`  |
| `EditRecipePage.tsx`   | 24KB | Dùng chung `RecipeForm` với CreateRecipePage                         |
| `RecipeDetailPage.tsx` | 25KB | Tách → `RecipeHeader`, `IngredientList`, `StepList`, `RecipeActions` |
| `UserProfile.tsx`      | 26KB | Tách → `ProfileHeader`, `ProfileStats`, `ProfileTabs`, `RecipeGrid`  |

#### 1.2. Xây dựng UI Component Library (`components/ui/`)

Hiện tại chỉ có `Button` và `Toaster`. Cần bổ sung:

- **Form controls:** `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
- **Feedback:** `Modal/Dialog`, `Dropdown`, `Tooltip`, `Badge`, `Skeleton`
- **Layout:** `Card`, `Tabs`, `Pagination`, `EmptyState`, `Avatar`

#### 1.3. Chuẩn hóa codebase

- Thiết lập consistent naming convention
- Chuẩn hóa error handling pattern
- Tạo shared TypeScript types/interfaces phù hợp với backend DTOs

---

### Phase 2: ✨ Hoàn thiện Core Features

> **Mục tiêu:** Tích hợp đầy đủ với các API endpoints đã có trên backend.

#### 2.1. Notification System (real-time)

- **Service:** `notificationService.ts` — CRUD notifications
- **Hook:** `useNotifications.ts` — WebSocket (Socket.IO) + React Query
- **Components:**
  - `NotificationBell` (Header) — badge số thông báo chưa đọc
  - `NotificationDropdown` — danh sách nhanh
  - `NotificationsPage` — full page, filter theo loại (LIKE, COMMENT, FOLLOW, SYSTEM)
- **Route:** `/notifications`

#### 2.2. Collections System

- **Service:** `collectionService.ts` — CRUD collections, add/remove recipes
- **Hook:** `useCollections.ts`
- **Components:**
  - `CollectionCard` — hiển thị bộ sưu tập
  - `CollectionGrid` — grid layout
  - `AddToCollectionModal` — thêm recipe vào collection
  - `CollectionDetailPage` — xem chi tiết collection
- **Routes:** `/collections`, `/collections/:id`

#### 2.3. Categories & Feed

- **Service:** `categoryService.ts`, `feedService.ts`
- **Cải thiện `HomePage`:** Thay nội dung static → hiển thị **feed thực tế** (trending recipes, recent, by category)
- **Components:** `CategoryFilter`, `CategoryChips`, `FeedCard`
- **Cải thiện `RecipesPage`:** Thêm filter theo category, sort options

#### 2.4. Ingredients Autocomplete

- **Service:** `ingredientService.ts`
- **Component:** `IngredientAutocomplete` — search & suggest nguyên liệu khi tạo recipe
- Tích hợp vào `RecipeForm` (Phase 1)

---

### Phase 3: 🛡️ Admin & Moderation Dashboard

> **Mục tiêu:** Xây dựng dashboard quản trị hoàn chỉnh.

#### 3.1. Hoàn thiện Moderation

Hiện tại `ModerationPage` chỉ là placeholder. Các route `/moderation/content`, `/moderation/users`, `/moderation/analytics` đang render `<div>` rỗng.

- **Service:** `reportService.ts`, `adminService.ts`
- **Pages cần xây dựng:**

| Route                   | Chức năng                                           |
| ----------------------- | --------------------------------------------------- |
| `/moderation`           | Dashboard tổng quan (pending recipes, open reports) |
| `/moderation/queue`     | Duyệt recipes (approve/reject)                      |
| `/moderation/content`   | Quản lý nội dung (recipes, comments)                |
| `/moderation/users`     | Quản lý users (block, change role)                  |
| `/moderation/analytics` | Thống kê (số recipes, users, reports)               |
| `/moderation/reports`   | Xử lý báo cáo vi phạm                               |

#### 3.2. Admin Dashboard

- **Route:** `/admin` (role: ADMIN only)
- **Features:** Quản lý toàn bộ hệ thống, user roles, system settings
- **Components:** `AdminLayout`, `StatsCards`, `Charts`, `DataTable`

---

### Phase 4: 💅 UI/UX & Quality Improvements

> **Mục tiêu:** Nâng cấp trải nghiệm người dùng và chất lượng code.

#### 4.1. UI/UX Enhancements

- **Dark mode:** Mở rộng `themeContext` hiện có → hỗ trợ dark/light toggle toàn app
- **Responsive design:** Review & cải thiện mobile experience
- **Animations:** Thêm page transitions, skeleton loading, micro-animations
- **Empty states:** Thiết kế empty states cho tất cả các pages
- **Error boundaries:** React Error Boundaries cho từng section

#### 4.2. i18n Completion

- Hoàn thiện translation cho Vietnamese & English
- Đảm bảo tất cả hardcoded text được chuyển sang i18n keys

#### 4.3. Testing

- Setup Vitest cho frontend
- Unit tests cho hooks và services
- Component tests cho UI components
- Integration tests cho các flows chính (auth, create recipe, etc.)

#### 4.4. Performance Optimization

- **Lazy loading:** React.lazy + Suspense cho routes
- **Image optimization:** Lazy loading images, responsive srcset
- **Code splitting:** Tách vendor bundles
- **Caching:** Tối ưu React Query cache strategies

---

## 📁 Cấu trúc thư mục đề xuất (sau refactor)

```
src/
├── components/
│   ├── common/           # Shared components (giữ nguyên, refactor)
│   ├── layout/           # Layout components (giữ nguyên)
│   └── ui/               # UI primitives (MỞ RỘNG)
│       ├── button.tsx
│       ├── input.tsx
│       ├── modal.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       ├── skeleton.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── dropdown.tsx
│       ├── pagination.tsx
│       └── ...
├── features/
│   ├── auth/             # ✅ Đã có
│   ├── recipes/          # ✅ Đã có → refactor RecipeForm
│   │   └── components/
│   │       ├── RecipeForm.tsx      # [NEW] shared cho create/edit
│   │       ├── IngredientInput.tsx # [NEW]
│   │       ├── StepEditor.tsx      # [NEW]
│   │       └── ImageUpload.tsx     # [NEW]
│   ├── moderation/       # ⚠️ Cần hoàn thiện
│   ├── notifications/    # [NEW]
│   ├── collections/      # [NEW]
│   ├── categories/       # [NEW]
│   ├── feed/             # [NEW]
│   ├── admin/            # [NEW]
│   └── reports/          # [NEW]
├── services/
│   ├── authService.ts         # ✅
│   ├── recipeService.ts       # ✅
│   ├── commentService.ts      # ✅
│   ├── userService.ts         # ✅
│   ├── cloudinaryService.ts   # ✅
│   ├── notificationService.ts # [NEW]
│   ├── collectionService.ts   # [NEW]
│   ├── categoryService.ts     # [NEW]
│   ├── feedService.ts         # [NEW]
│   ├── reportService.ts       # [NEW]
│   ├── ingredientService.ts   # [NEW]
│   └── adminService.ts        # [NEW]
├── hooks/                 # Mở rộng thêm hooks
├── pages/                 # Refactor + thêm pages mới
├── types/                 # Mở rộng types
└── ...
```

---

## ⚡ Gợi ý bắt đầu

Nếu muốn bắt tay ngay, nên bắt đầu từ **Phase 1.1** — Refactor `CreateRecipePage` và `EditRecipePage` vì:

1. Tạo nền tảng `RecipeForm` dùng chung, giảm duplication
2. Code dễ maintain hơn cho tất cả công việc sau này
3. Không ảnh hưởng tính năng hiện có, chỉ cải thiện cấu trúc

> ⚠️ **Lưu ý:** Trước khi bắt đầu mỗi Phase, nên review lại codebase hiện tại vì có thể đã có thay đổi từ các thành viên khác.
