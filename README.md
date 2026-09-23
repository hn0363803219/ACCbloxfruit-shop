# BloxShop V2

## Chạy trên máy tính

1. Cài Node.js 20+.
2. Mở Terminal trong thư mục dự án.
3. Chạy:
   npm install
   npm start
4. Mở http://localhost:3000

## Tài khoản admin mặc định cho demo

Username: admin
Password: change-this-password

Trước khi đưa lên Internet, hãy đổi ADMIN_PASSWORD và SESSION_SECRET bằng biến môi trường.

## Có gì trong V2

- Frontend responsive
- Backend Express
- Database JSON (`db.json`) để lưu sản phẩm và đơn
- API sản phẩm
- API tạo đơn
- Admin login
- Admin dashboard
- Thêm sản phẩm
- Ẩn sản phẩm
- Đổi trạng thái đơn

## Lưu ý triển khai thật

`db.json` phù hợp cho bản thử nghiệm nhỏ. Khi có khách thật, nên chuyển sang PostgreSQL/MySQL hoặc dịch vụ database managed, thêm HTTPS, rate limiting, CSRF/session bảo mật, backup, phân quyền admin và tích hợp cổng thanh toán.
