# � Quy Chế Đóng Góp (Contributing Guidelines)

Chào mừng bạn đến với dự án Snap Chef! Tài liệu này mô tả quy trình làm việc để đảm bảo code sạch sẽ, chất lượng và thống nhất.

---

## 🛠️ I. Thiết Lập Môi Trường (Setup)

1.  **Yêu cầu tiên quyết:**
    -   Node.js (>= 18)
    -   pnpm (>= 9)

2.  **Cài đặt:**
    ```bash
    git clone ...
    cd snap-chef
    pnpm install
    ```

3.  **Biến môi trường:**
    -   Copy file `.env-example` thành `.env` trong các thư mục ứng dụng tương ứng (`apps/api`, `apps/web`...) và cấu hình các giá trị cần thiết.

---

## ✅ II. Kiểm Tra Chất Lượng (Verification)

**Trước khi tạo Pull Request**, bạn BẮT BUỘC phải đảm bảo code của mình vượt qua các bài kiểm tra tự động. CI/CD pipeline sẽ tự động chạy các bước này, nhưng bạn nên chạy cục bộ để tiết kiệm thời gian.

Tại thư mục gốc (root):

1.  **Kiểm tra Type (TypeScript):**
    ```bash
    pnpm check-types
    ```
2.  **Kiểm tra Lint:**
    ```bash
    pnpm lint
    ```
3.  **Chạy Test:**
    ```bash
    pnpm test
    ```

---

## 🔄 III. Quy Trình Git & Rebase

Chúng ta sử dụng quy trình **Rebase** để giữ lịch sử commit tuyến tính và sạch sẽ trên nhánh `dev`.

### 1. Nguyên Tắc Vàng ⚠️
**KHÔNG BAO GIỜ** rebase một nhánh đã được chia sẻ công khai (`dev` hoặc bất kỳ nhánh nào đồng đội đã clone). Chỉ rebase **nhánh tính năng cục bộ** của bạn.

### 2. Các Bước Thực Hiện

#### A. Chuẩn Bị và Phát Triển
1.  **Đồng bộ hóa nhánh `dev`:**
    ```bash
    git checkout dev
    git pull origin dev
    ```
2.  **Tạo nhánh tính năng:**
    Đặt tên theo format `loại/tên-tính-năng`. Ví dụ: `feat/group-chat`, `fix/login-bug`.
    ```bash
    git checkout -b feat/ten-tinh-nang
    ```
3.  **Phát triển và Commit:**
    *Khuyến khích sử dụng Conventional Commits (ví dụ: `feat: add login`, `fix: header layout`).*
    ```bash
    git add .
    git commit -m "feat: mô tả công việc"
    ```

#### B. Làm Sạch Lịch Sử (Rebase Cục Bộ)
Trước khi push hoặc mở PR, hãy cập nhật nhánh của bạn với code mới nhất từ `dev` để tránh xung đột sau này.

1.  **Lấy code mới nhất:**
    ```bash
    git checkout dev
    git fetch origin dev
    git pull origin dev
    ```
2.  **Thực hiện Rebase:**
    ```bash
    git checkout feat/ten-tinh-nang
    git rebase dev
    ```
    *   *Nếu có xung đột (`conflict`):* Giải quyết file conflict -> `git add .` -> `git rebase --continue`.
3.  **Đẩy code (Push):**
    Nếu bạn đã push nhánh này trước đó, sau khi rebase bạn cần force push.
    ```bash
    git push origin feat/ten-tinh-nang --force-with-lease
    ```

---

## 🔀 IV. Quy Trình Pull Request (PR)

1.  Tạo Pull Request trên GitHub hướng vào nhánh `dev`.
2.  **Tiêu đề PR:** Rõ ràng, mô tả ngắn gọn tính năng (VD: `[Feat] Group Management`).
3.  **Checklist:**
    -   [ ] Code đã được format và lint.
    -   [ ] Đã chạy `pnpm check-types` và `pnpm test` thành công.
    -   [ ] Đã tự review code của mình.
4.  **Hợp nhất (Merge):**
    -   Người review (hoặc bạn nếu được phép) sẽ chọn **`Rebase and Merge`** để đưa code vào `dev`.
    -   *Lý do:* Giữ lịch sử `dev` thẳng hàng, không tạo ra các "merge commit" thừa thãi.