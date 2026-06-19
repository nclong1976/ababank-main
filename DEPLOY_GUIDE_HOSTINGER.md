# Hướng dẫn triển khai lên Hostinger

Dưới đây là các bước để đưa ứng dụng ABA Clone này lên Hostinger:

## Bước 1: Chuẩn bị mã nguồn
1. Tải toàn bộ mã nguồn về máy tính.
2. Chạy lệnh `npm install` và `npm run build`.
3. Bạn sẽ nhận được thư mục `dist`.

## Bước 2: Cài đặt trên Hostinger (Node.js)
Hostinger hỗ trợ Node.js thông qua mục "Node.js Selector" trong hPanel.

1. **Upload**: Tải tất cả các tệp (trừ `node_modules`) lên thư mục ứng dụng trên Hostinger (ví dụ: `/public_html/app`).
2. **Setup Node.js App**:
   - Application root: `/public_html/app`
   - Application URL: `yourdomain.com`
   - Application startup file: `server.ts` (hoặc build ra `.cjs` nếu hosting yêu cầu).
3. **Environment Variables**:
   - Thêm `DATABASE_URL` từ dịch vụ MySQL/PostgreSQL của Hostinger.
   - Thêm `GEMINI_API_KEY` nếu muốn dùng tính năng AI.
4. **Run npm install**: Sử dụng nút "Run npm install" trong hPanel.
5. **Database**: Chạy `npx prisma db push` qua Terminal trong Hostinger để tạo bảng.

## Bước 3: Cài đặt dạng Static (Chỉ Frontend)
Nếu bạn chỉ muốn dùng giao diện mà không cần database thật:
1. Copy toàn bộ nội dung TRONG thư mục `dist` vào `public_html`.
2. Ứng dụng sẽ chạy nhưng các tính năng lưu trữ lịch sử giao dịch thật sẽ không hoạt động (sẽ báo lỗi API).

---
*Lưu ý: Mã PIN mặc định hiện tại là **1234***
