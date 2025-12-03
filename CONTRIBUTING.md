# 👨‍💻 Quy Trình Làm Việc Git Rebase trên GitHub (Dev Branch)

Quy trình này nhằm mục đích tạo ra một **lịch sử commit tuyến tính, sạch sẽ** (`linear, clean history`) trên nhánh chính (`dev`) bằng cách sử dụng `git rebase` cục bộ và tính năng **Rebase and Merge** của GitHub.

---

## ⚠️ Nguyên Tắc Vàng

**KHÔNG BAO GIỜ** rebase một nhánh đã được chia sẻ công khai (`dev` hoặc bất kỳ nhánh nào đồng đội đã clone). Chúng ta chỉ rebase **nhánh tính năng cục bộ** (`feature-branch`) của mình.

---

## 🚀 Các Bước Thực Hiện

### I. Chuẩn Bị và Phát Triển

1.  **Đồng bộ hóa nhánh `dev`:**
    ```bash
    git checkout dev
    git pull origin dev 
    ```
    *(Đảm bảo nhánh dev cục bộ của bạn là mới nhất.)*

2.  **Tạo nhánh tính năng:**
    ```bash
    git checkout -b ten-tinh-nang
    ```

3.  **Phát triển và Commit:**
    *(Thực hiện công việc và commit thường xuyên.)*
    ```bash
    git add .
    git commit -m "Thêm tính năng A"
    # ...
    ```

### II. Làm Sạch Lịch Sử (Rebase Cục Bộ)

Trước khi mở Pull Request (PR) hoặc sau khi PR đã chạy được một thời gian và nhánh `dev` đã có các commit mới, bạn cần rebase nhánh tính năng của mình.

1.  **Lấy các thay đổi mới nhất từ remote `dev`:**
    ```bash
    git checkout dev
    git fetch origin dev
    ```

2.  **Thực hiện Rebase:**
    ```bash
    git checkout ten-tinh-nang
    git rebase origin/dev
    ```
    * 💡 **Hành động:** Git sẽ dỡ bỏ các commit của bạn và áp dụng lại chúng lên trên commit mới nhất của `origin/dev`.
    * 💥 **Giải quyết xung đột:** Nếu có xung đột (`conflict`), Git sẽ tạm dừng. Bạn cần giải quyết xung đột, sau đó chạy:
      ```bash
      git add .
      git rebase --continue
      ```

3.  **Đẩy Cưỡng Bức (Force Push) lên GitHub:**
    Vì `rebase` đã viết lại lịch sử commit của nhánh tính năng, bạn cần sử dụng **force push** để cập nhật PR trên GitHub.
    ```bash
    git push origin ten-tinh-nang --force-with-lease
    ```
    * 🛡️ **`--force-with-lease`** an toàn hơn `--force` vì nó kiểm tra xem bạn có vô tình ghi đè công việc của người khác lên cùng một nhánh không.

### III. Hợp Nhất (Merge) trên GitHub

Sau khi PR được review và phê duyệt, bạn sẽ sử dụng giao diện GitHub để hợp nhất nó.

* **Tại giao diện Pull Request:** Chọn tùy chọn **`Rebase and Merge`**.

    | Tùy chọn | Mục đích | Lịch sử `dev` |
    | :--- | :--- | :--- |
    | **Rebase and Merge** (Ưu tiên) | Lấy từng commit trên nhánh tính năng và áp dụng chúng lên `dev` một cách tuần tự. | **Tuyến tính, Sạch sẽ, Giữ nguyên Commit** |
    | **Squash and Merge** | Nén tất cả commit trên nhánh tính năng thành **một commit DUY NHẤT** trước khi hợp nhất vào `dev`. | **Rất Sạch, Một Commit/Tính năng, Mất lịch sử chi tiết** |
    | **Create a Merge Commit** | Tạo một commit hợp nhất (thường được gọi là "3-way merge"). | **Lịch sử lộn xộn (merge commit), Không ưu tiên trong quy trình Rebase** |

---