# 📋 Bối cảnh dự án Snap Chef

> **Version:** 1.2.0
> **Cập nhật lần cuối:** 2026-03-13

---

## 1. Giới thiệu dự án

**Snap Chef** là một nền tảng chia sẻ công thức nấu ăn (recipe sharing platform) cho phép người dùng tạo, chia sẻ, khám phá và tương tác với các công thức nấu ăn từ cộng đồng. Dự án được xây dựng theo kiến trúc **monorepo** sử dụng Turborepo, bao gồm ứng dụng backend API và frontend web.

## 2. Mục tiêu dự án

- **Chia sẻ công thức nấu ăn:** Cho phép người dùng đăng tải, chỉnh sửa và chia sẻ các công thức nấu ăn kèm hình ảnh, nguyên liệu và các bước thực hiện.
- **Khám phá & tương tác:** Cung cấp hệ thống Feed, bình luận (comments), bộ sưu tập (collections) và thông báo (notifications) để tạo trải nghiệm cộng đồng.
- **Quản trị nội dung:** Hỗ trợ hệ thống kiểm duyệt (moderation) công thức, quản lý báo cáo vi phạm (reports) và quản trị viên (admin).
- **Xác thực & bảo mật:** Cung cấp hệ thống xác thực đa phương thức (JWT, Google OAuth) với chức năng đặt lại mật khẩu qua email.
- **Hiệu năng & mở rộng:** Sử dụng Redis cho caching, rate limiting và real-time communication qua WebSocket.
- **Đa ngôn ngữ:** Hỗ trợ quốc tế hóa (i18n) cho giao diện người dùng.

## 3. Công nghệ sử dụng

### 3.1. Monorepo & Tooling

| Công nghệ  | Phiên bản | Mô tả                                |
| ---------- | --------- | ------------------------------------ |
| Turborepo  | ^2.6.1    | Quản lý monorepo, task orchestration |
| pnpm       | 9.0.0     | Package manager                      |
| TypeScript | ~5.9.x    | Ngôn ngữ lập trình chính             |
| Prettier   | ^3.6.2    | Code formatter                       |
| ESLint     | ^9.39.x   | Linter                               |

### 3.2. Backend (`apps/api`)

| Công nghệ               | Phiên bản        | Mô tả                                     |
| ----------------------- | ---------------- | ----------------------------------------- |
| NestJS                  | ^11.1.14         | Framework backend chính                   |
| Prisma                  | ^7.4.2           | ORM, quản lý database schema & migration  |
| PostgreSQL              | 15 (Alpine)      | Cơ sở dữ liệu chính                       |
| Redis                   | Alpine           | Caching, rate limiting, WebSocket adapter |
| Passport                | ^0.7.0           | Xác thực (JWT, Local, Google OAuth)       |
| Swagger                 | ^11.2.6          | API documentation                         |
| Socket.IO               | ^4.8.3           | Real-time communication (WebSocket)       |
| Nodemailer + Handlebars | ^7.0.13 / ^4.7.8 | Gửi email (đặt lại mật khẩu, thông báo)   |
| Argon2                  | ^0.44.0          | Mã hóa mật khẩu                           |
| Jest                    | ^30.2.0          | Unit testing                              |

### 3.3. Frontend (`apps/web`)

| Công nghệ            | Phiên bản          | Mô tả                                   |
| -------------------- | ------------------ | --------------------------------------- |
| React                | ^19.2.0            | UI library                              |
| Vite                 | ^7.2.4             | Build tool & dev server                 |
| TailwindCSS          | 3                  | CSS framework                           |
| React Router         | ^7.10.0            | Client-side routing                     |
| TanStack React Query | ^5.90.12           | Server state management & data fetching |
| Zustand              | ^5.0.9             | Client state management                 |
| Axios                | ^1.13.2            | HTTP client                             |
| React Hook Form      | ^7.68.0            | Quản lý form                            |
| i18next              | ^25.7.3            | Quốc tế hóa (i18n)                      |
| Lucide React         | ^0.555.0           | Icon library                            |
| Sonner + SweetAlert2 | ^2.0.7 / ^11.26.17 | Toast & alert notifications             |

### 3.4. Shared Packages

| Package                      | Mô tả                            |
| ---------------------------- | -------------------------------- |
| `packages/ui`                | Thư viện UI component dùng chung |
| `packages/eslint-config`     | Cấu hình ESLint dùng chung       |
| `packages/typescript-config` | Cấu hình TypeScript dùng chung   |

### 3.5. DevOps & Infrastructure

| Công nghệ               | Mô tả                                       |
| ----------------------- | ------------------------------------------- |
| Docker & Docker Compose | Containerization cho môi trường development |
| GitHub Actions          | CI/CD pipeline                              |

## 4. Kiến trúc hệ thống

```
snap-chef/
├── apps/
│   ├── api/          # NestJS Backend API
│   │   └── src/modules/
│   │       ├── admin/          # Quản trị viên
│   │       ├── auth/           # Xác thực (JWT, OAuth)
│   │       ├── categories/     # Danh mục công thức
│   │       ├── collections/    # Bộ sưu tập
│   │       ├── comments/       # Bình luận
│   │       ├── feed/           # News feed
│   │       ├── ingredients/    # Nguyên liệu
│   │       ├── mail/           # Gửi email
│   │       ├── notifications/  # Thông báo
│   │       ├── oauth-accounts/ # Tài khoản OAuth
│   │       ├── recipes/        # Công thức nấu ăn
│   │       ├── reports/        # Báo cáo vi phạm
│   │       └── users/          # Người dùng
│   └── web/          # React + Vite Frontend
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TS config
├── docker-compose.yml
└── turbo.json
```

## 5. Tình hình hiện tại (Cập nhật: 2026-03-13)

### 5.1. Backend (`apps/api`) — ✅ Hoàn thiện cơ bản (v1.3.0)

Backend đã được phát triển tương đối đầy đủ với **13 modules**:

| Module           | Trạng thái    | Unit Test                 | Mô tả                             |
| ---------------- | ------------- | ------------------------- | --------------------------------- |
| `admin`          | ✅ Hoàn thành | ❌                        | Quản trị hệ thống                 |
| `auth`           | ✅ Hoàn thành | ✅                        | Xác thực JWT, Local, Google OAuth |
| `categories`     | ✅ Hoàn thành | ✅ (controller + service) | CRUD danh mục                     |
| `collections`    | ✅ Hoàn thành | ✅                        | Bộ sưu tập công thức              |
| `comments`       | ✅ Hoàn thành | ✅                        | Bình luận kèm đánh giá            |
| `feed`           | ✅ Hoàn thành | ✅ (controller + service) | News feed                         |
| `ingredients`    | ✅ Hoàn thành | ✅                        | Quản lý nguyên liệu               |
| `mail`           | ✅ Hoàn thành | ❌                        | Email (reset password, verify)    |
| `notifications`  | ✅ Hoàn thành | ✅                        | Thông báo real-time (WebSocket)   |
| `oauth-accounts` | ✅ Hoàn thành | ❌                        | Liên kết tài khoản OAuth          |
| `recipes`        | ✅ Hoàn thành | ✅                        | CRUD công thức nấu ăn             |
| `reports`        | ✅ Hoàn thành | ✅ (controller + service) | Báo cáo vi phạm                   |
| `users`          | ✅ Hoàn thành | ✅                        | Quản lý người dùng, block, follow |

**Tính năng đã hoàn thiện:**

- Swagger API documentation đã được tích hợp và ghi chú cho các endpoint
- Email templates (Handlebars): `reset-password.hbs`, `email-verify.hbs`
- 13 unit test files cho các service/controller
- Database: **14 models** (User, Recipe, Ingredient, RecipeIngredient, Step, Like, Comment, Follow, Collection, Notification, Report, Category, OauthAccount, Block)

### 5.2. Frontend (`apps/web`) — ⚠️ Chưa hoàn thiện (do thành viên cũ để lại)

Frontend được xây dựng bởi thành viên trước, hiện **không còn tiếp tục phát triển**. Tổng cộng có **~72 source files**.

#### Đã có:

| Thành phần            | Số lượng  | Chi tiết                                                                                                                                                                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Pages**             | 14        | HomePage (Redesigned with Stitch), AuthPage, CreateRecipePage, EditRecipePage, RecipeDetailPage, RecipesPage, DashboardPage, FavoritesPage, MyRecipesPage, SettingsPage, FollowListPage, UserSearchPage, ModerationPage, NotFound    |
| **Features**          | 4 modules | `feed` (New: FeedHero, RecipeFeedCard, FeedSidebar, FeedFilterBar), `auth` (LoginForm, RegisterForm, useAuth), `recipes` (RecipeCard, RecipeList, RecipeListLoadMore, useRecipeActions), `moderation` (ApprovalQueue, useModeration) |
| **Common Components** | 14        | BookmarkButton, CommentForm, ErrorState, FollowButton, FollowersFollowingModal, GlobalSearch, Loading, RatingDisplay, RecipeComments, SearchInput, ShareButton, StarRating, UserProfile, UserSearch                                  |
| **Layout Components** | 4         | Header, MainLayout, Sidebar, UserMenu                                                                                                                                                                                                |
| **Services**          | 5         | authService, recipeService, commentService, userService, cloudinaryService                                                                                                                                                           |
| **Hooks**             | 5         | useDebounce, useDocumentTitle, useRecipeLoadMore, useRecipeSearch, useUser                                                                                                                                                           |
| **Core Libs**         | 5         | axios (interceptors), api, store (Zustand), toast-store, utils                                                                                                                                                                       |
| **Context**           | 2         | authContext, themeContext                                                                                                                                                                                                            |
| **Routing**           | 3 files   | AppRoutes, ProtectedRoute, RootRedirect                                                                                                                                                                                              |

#### Vấn đề cần lưu ý:

- **Pages quá lớn:** `CreateRecipePage` (25KB), `EditRecipePage` (24KB), `RecipeDetailPage` (25KB) → cần tách nhỏ thành sub-components
- **ModerationPage chưa hoàn thiện:** chỉ 223 bytes (placeholder)
- **Thiếu nhiều features:** Notifications UI, Collections UI, Admin dashboard, Analytics
- **Thiếu testing:** Chưa có unit test cho frontend
- **Chất lượng code chưa đồng nhất:** Do người phát triển trước để lại, cần review và refactor

#### Quyết định: Tiếp tục phát triển trên codebase hiện tại ✅

**Lý do:**

1. Tech stack đã rất hiện đại (React 19, Vite 7, TanStack Query, Zustand)
2. Cấu trúc feature-based architecture hợp lý, dễ mở rộng
3. Nền tảng cơ bản đã vững (auth flow, API client, routing, state management, i18n)
4. Đã tích hợp tốt với monorepo (Turborepo, pnpm workspace)
5. Viết lại từ đầu sẽ mất thời gian cho những thứ đã có mà không mang lại giá trị thêm

**Chiến lược tiếp tục:**

1. Refactor các pages lớn (25KB+) → tách thành smaller components
2. Hoàn thiện features còn thiếu (notifications, collections, admin dashboard...)
3. Cải thiện UI/UX design
4. Bổ sung unit test cho frontend

### 5.3. Database Schema

**14 models** đã được định nghĩa trong Prisma với 6 enums:

| Model              | Mô tả                                                   |
| ------------------ | ------------------------------------------------------- |
| `User`             | Người dùng (roles: USER, MODERATOR, ADMIN)              |
| `Block`            | Chặn người dùng (many-to-many)                          |
| `OauthAccount`     | Liên kết OAuth (Google, Facebook)                       |
| `Recipe`           | Công thức (status: DRAFT, PUBLISHED, PENDING, REJECTED) |
| `Ingredient`       | Nguyên liệu                                             |
| `RecipeIngredient` | Nguyên liệu trong công thức (quantity, unit)            |
| `Step`             | Bước thực hiện (ordered)                                |
| `Like`             | Thích công thức                                         |
| `Comment`          | Bình luận kèm rating                                    |
| `Follow`           | Theo dõi người dùng                                     |
| `Collection`       | Bộ sưu tập (public/private)                             |
| `Notification`     | Thông báo (LIKE, COMMENT, FOLLOW, SYSTEM, REPORT)       |
| `Report`           | Báo cáo vi phạm (SPAM, COPYRIGHT, FAKE_ACCOUNT...)      |
| `Category`         | Danh mục công thức                                      |

## 6. Lịch sử phiên bản

| Version | Ngày cập nhật | Mô tả thay đổi                                                  |
| ------- | ------------- | --------------------------------------------------------------- |
| 1.0.0   | 2026-03-13    | Khởi tạo tài liệu bối cảnh dự án                                |
| 1.1.0   | 2026-03-13    | Thêm tình hình hiện tại của dự án (backend, frontend, database) |
| 1.2.0   | 2026-03-13    | Hoàn thành redesign Trang chủ (Home Feed) theo thiết kế Stitch  |
