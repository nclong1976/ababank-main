# Hướng dẫn triển khai lên Hostinger (Full-stack Node.js + React)

Ứng dụng của bạn là một ứng dụng Full-stack tích hợp sẵn (Express phục vụ cả API và Frontend React). Theo dõi các bước sau để triển khai lên Hostinger:

## 1. Chuẩn bị tệp tin (Build)
- Chạy lệnh `npm run build` trên máy cục bộ của bạn.
- Thư mục `dist/` sẽ xuất hiện. Đây là mã nguồn Frontend đã biên dịch.
- **Quan trọng:** Khi nén tệp, hãy bao gồm cả thư mục `dist/`.

## 2. Cấu trúc thư mục trước khi nén
Bạn nên nén các tệp sau vào một file `deploy.zip`:
- `dist/` (Thư mục đã build)
- `index.js` (Server chính)
- `db.mysql.js` (Đổi tên thành `db.js` nếu muốn dùng MySQL)
- `schema.sql` (Dùng để tạo bảng trong MySQL)
- `package.json`
- `.env` (Chứa các thông số thực tế của Hostinger)

**Lưu ý:** KHÔNG nén thư mục `node_modules` và thư mục `src/` (trừ khi bạn muốn giữ lại code gốc trên host).

## 3. Cấu hình Cơ sở dữ liệu (MySQL)
Nếu bạn chuyển từ SQLite sang MySQL trên Hostinger:
1. Tạo Database MySQL trong bảng điều khiển Hostinger (hpanel).
2. Lưu lại các thông tin: **Database Name**, **User**, **Password**.
3. Cập nhật file `.env` trên Hostinger:
   ```env
   DB_HOST=localhost
   DB_USER=u123456789_user
   DB_PASS=your_password
   DB_NAME=u123456789_database
   ```
4. Sử dụng mã nguồn trong `db.mysql.js` để thay thế cho `db.js`.

## 4. Các bước thực hiện trên Hostinger
1. **Tải lên:** Truy cập **File Manager**, tải file `deploy.zip` lên thư mục `public_html` (hoặc thư mục con nếu chạy subdomain) và giải nén.
2. **Thiết lập Node.js:** 
   - Tìm mục **Setup Node.js App** trong Hostinger Panel.
   - Click **Create Application**.
   - **Node.js version:** Chọn bản mới nhất (18+ hoặc 20+).
   - **Application mode:** Chọn `production`.
   - **Application root:** Đường dẫn thư mục bạn vừa upload (ví dụ: `public_html`).
   - **Application URL:** Chọn domain của bạn.
   - **Application startup file:** Điền `index.js`.
   - Click **Create**.
3. **Cài đặt Dependencies:** Sau khi tạo App, click vào nút **Run npm install** (thường nằm cạnh nút start app) để Hostinger tự cài các thư viện từ `package.json`.
4. **Biến môi trường:** Thêm các biến từ file `.env` vào mục **Environment variables** trong giao diện Setup Node.js.

## 5. File .htaccess (Dành cho Apache/Passenger)
Hostinger thường tự tạo file này khi bạn cấu hình Node.js App. Nếu cần chỉnh sửa thủ công để hỗ trợ routing, hãy đảm bảo nó trông như sau:

```apache
# DO NOT REMOVE OR MODIFY.
PassengerAppRoot "/home/u123456789/public_html"
PassengerBaseURI "/"
PassengerAppType node
PassengerStartupFile index.js
```

## 6. Lưu ý về MySQL
Bạn cần chạy các lệnh SQL trong `schema.sql` thông qua **phpMyAdmin** trên Hostinger để tạo các bảng cần thiết trước khi chạy ứng dụng.
