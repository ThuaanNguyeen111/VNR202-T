# Giải mã con chữ – trò chơi ôn tập HCM202

Trò chơi kiểu Kahoot cho phần ôn tập Chương VI, mục IV (Tư tưởng Hồ Chí Minh về văn hóa, đạo đức, con người).

- Máy chiếu mở trang **Người dẫn trò chơi** → hiện mã QR + mã phòng.
- Cả lớp quét QR bằng điện thoại, nhập tên.
- 2 dạng câu: **chọn A/B/C/D** và **giải chữ** (gõ có dấu hay không dấu đều được).
- 30 giây/câu, trả lời nhanh nhiều điểm, đúng liên tiếp được thưởng (🔥 tối đa +30%), dùng gợi ý chỉ nhận 50% điểm.
- Sau mỗi câu: đáp án, giải thích theo giáo trình, thống kê lựa chọn, bảng xếp hạng có mũi tên lên/xuống hạng.
- Cả lớp trả lời xong thì tự hiện đáp án, không cần chờ hết giờ.

## Sửa câu hỏi
Mở `src/data/quizData.js`. Mỗi câu có `type` ("choice" hoặc "scramble"), `question`, `correct`, `explain`; câu "choice" có thêm `options` (đáp án đúng phải trùng y hệt một phương án). Chữ xáo trộn được tạo tự động.

Đổi số giây mỗi câu: `TIME_LIMIT` trong `src/firebase/gameService.js`.

## Chạy thử trên máy
```bash
npm install
npm run dev -- --host
```
Mở `http://localhost:5173` → "Mở phòng mới". Điện thoại cùng Wi-Fi vào bằng địa chỉ `http://192.168.x.x:5173` mà terminal in ra.

## Đưa lên mạng (khuyên dùng khi thuyết trình)
```bash
npm run build
```
Rồi đăng thư mục `dist` lên Vercel/Netlify (hoặc nối repo GitHub với Vercel để tự deploy mỗi lần push). Nhớ khai báo các biến `VITE_FIREBASE_*` trong phần Environment Variables của Vercel.

## Firebase
Cần file `.env` (xem `.env.example`). Trong Firebase Console → Realtime Database → Rules, đảm bảo cho phép đọc/ghi nhánh `rooms`.
