import { useState } from "react";
import { Star } from "../components/ui";
import { quizData } from "../data/quizData";
import { TIME_LIMIT, CODE_LENGTH, cleanRoomCode } from "../firebase/gameService";

export default function HomePage() {
  const [code, setCode] = useState("");

  const goHost = () => {
    window.location.href = `${window.location.pathname}?mode=host`;
  };
  const goJoin = (e) => {
    e.preventDefault();
    const c = cleanRoomCode(code);
    if (c.length < CODE_LENGTH) return;
    window.location.href = `${window.location.pathname}?room=${c}`;
  };

  return (
    <main className="home">
      <section className="home-poster">
        <Star size={120} className="home-star" />
        <p className="home-course">HCM202 · Chương VI, mục IV</p>
        <h1 className="home-title">
          <span>Giải mã</span>
          <span>con chữ</span>
        </h1>
        <p className="home-lede">
          Trò chơi ôn tập: xây dựng văn hóa, đạo đức, con người Việt Nam
          theo tư tưởng Hồ Chí Minh. {quizData.length} câu, {TIME_LIMIT} giây
          mỗi câu, trả lời càng nhanh càng nhiều điểm.
        </p>
      </section>

      <section className="home-actions">
        <form className="home-join" onSubmit={goJoin}>
          <h2>Vào chơi</h2>
          <p>Nhập mã phòng đang hiện trên màn chiếu, hoặc quét mã QR.</p>
          <label htmlFor="home-code" className="sr-only">
            Mã phòng
          </label>
          <input
            id="home-code"
            className="field field-code"
            value={code}
            onChange={(e) => setCode(cleanRoomCode(e.target.value))}
            placeholder="6 chữ số"
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button className="btn btn-red" disabled={code.length < CODE_LENGTH}>
            Vào phòng
          </button>
        </form>

        <div className="home-host">
          <h2>Người dẫn trò chơi</h2>
          <p>Mở trên máy chiếu để tạo phòng và hiện mã QR cho cả lớp.</p>
          <button className="btn btn-ink" onClick={goHost}>
            Mở phòng mới
          </button>
        </div>
      </section>
    </main>
  );
}
