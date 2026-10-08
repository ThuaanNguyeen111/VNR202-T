import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { quizData, LETTERS } from "../data/quizData";
import {
  TIME_LIMIT,
  now,
  createRoom,
  startGame,
  revealAnswer,
  nextQuestion,
  endGame,
  listenRoom,
  listenPlayers,
  listenAnswers,
  deleteRoom,
} from "../firebase/gameService";
import { useConfetti, useSoundEffects } from "../hooks/useGameEffects";
import Confetti from "../components/Confetti";
import AudioController from "../components/AudioController";
import {
  Star,
  Tiles,
  Avatar,
  TimerBar,
  Podium,
  RankMove,
} from "../components/ui";

const byScore = (a, b) => b.score - a.score || a.joinedAt - b.joinedAt;

export default function HostPage() {
  const [phase, setPhase] = useState("creating"); // creating|lobby|question|reveal|finished
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [prevRanks, setPrevRanks] = useState(null);
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const roomCodeRef = useRef("");
  const phaseRef = useRef(phase);
  const currentQRef = useRef(0);
  const revealingRef = useRef(false);
  const playersRef = useRef([]);

  const { particles, triggerConfetti } = useConfetti();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    phaseRef.current = phase;
    currentQRef.current = currentQ;
    playersRef.current = players;
  }, [phase, currentQ, players]);

  // ── Tạo phòng ────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubRoom, unsubPlayers;
    let cancelled = false;
    (async () => {
      try {
        const code = await createRoom(quizData.length);
        if (cancelled) {
          deleteRoom(code);
          return;
        }
        roomCodeRef.current = code;
        setRoomCode(code);
        setPhase("lobby");
        unsubRoom = listenRoom(code, (d) => d && setRoom(d));
        unsubPlayers = listenPlayers(code, (list) => setPlayers(list.sort(byScore)));
      } catch (e) {
        console.error(e);
        setError(
          "Không kết nối được Firebase. Kiểm tra file .env và Rules của Realtime Database (phải cho phép đọc/ghi)."
        );
      }
    })();
    const cleanup = () => {
      if (roomCodeRef.current) deleteRoom(roomCodeRef.current);
    };
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cancelled = true;
      unsubRoom?.();
      unsubPlayers?.();
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, []);

  // ── Mã QR (tạo ngay trên máy, không cần mạng) ───────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    QRCode.toDataURL(url, { width: 520, margin: 0, color: { dark: "#161616", light: "#FFFDF7" } })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [roomCode]);

  // ── Nghe đáp án của câu hiện tại ────────────────────────────────────────
  useEffect(() => {
    if (!roomCode || (phase !== "question" && phase !== "reveal")) return;
    return listenAnswers(roomCode, currentQ, setAnswers);
  }, [roomCode, currentQ, phase]);

  // ── Đồng hồ đếm ngược (theo giờ máy chủ) ─────────────────────────────────
  useEffect(() => {
    if (phase !== "question" || !room?.questionStartTime) return;
    const tick = () => {
      const left = Math.max(
        0,
        TIME_LIMIT - Math.floor((now() - room.questionStartTime) / 1000)
      );
      setTimeLeft(left);
      if (left === 0) handleReveal();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, room?.questionStartTime]); // eslint-disable-line

  // ── Tất cả đã trả lời → tự hiện đáp án ──────────────────────────────────
  const answeredCount = Object.keys(answers).length;
  useEffect(() => {
    if (phase !== "question" || players.length === 0) return;
    if (answeredCount >= players.length) {
      const id = setTimeout(handleReveal, 1200);
      return () => clearTimeout(id);
    }
  }, [answeredCount, players.length, phase]); // eslint-disable-line

  const snapshotRanks = () => {
    const map = {};
    [...playersRef.current].sort(byScore).forEach((p, i) => (map[p.id] = i));
    setPrevRanks(map);
  };

  // ── Điều khiển ──────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (players.length === 0) return;
    playSound("click");
    snapshotRanks();
    setAnswers({});
    setCurrentQ(0);
    revealingRef.current = false;
    await startGame(roomCode);
    setPhase("question");
  };

  async function handleReveal() {
    if (phaseRef.current !== "question" || revealingRef.current) return;
    revealingRef.current = true;
    const q = currentQRef.current;
    await revealAnswer(roomCodeRef.current, q, quizData[q].correct);
    setPhase("reveal");
    playSound("correct");
  }

  const handleNext = async () => {
    playSound("click");
    const next = currentQ + 1;
    if (next >= quizData.length) {
      await endGame(roomCode);
      setPhase("finished");
      triggerConfetti(140);
      playSound("victory");
      return;
    }
    snapshotRanks();
    setAnswers({});
    setCurrentQ(next);
    revealingRef.current = false;
    await nextQuestion(roomCode, next);
    setPhase("question");
  };

  // ── Dữ liệu hiển thị ────────────────────────────────────────────────────
  const q = quizData[currentQ];
  const leaderboard = [...players].sort(byScore);
  const answerList = Object.values(answers);
  const correctCount = answerList.filter((a) => a.isCorrect).length;
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  // ── Render ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="center-screen">
        <div className="notice">
          <h1>Chưa tạo được phòng</h1>
          <p>{error}</p>
          <button className="btn btn-ink" onClick={() => window.location.reload()}>
            Thử lại
          </button>
          <a className="back-link" href={window.location.pathname}>
            ← Trang chủ
          </a>
        </div>
      </main>
    );
  }

  if (phase === "creating") {
    return (
      <main className="center-screen">
        <Star size={64} className="spin-star" />
        <p className="muted">Đang tạo phòng…</p>
      </main>
    );
  }

  return (
    <main className="host">
      <Confetti particles={particles} />
      <div className="host-audio">
        <AudioController
          isPlayingBgm={phase === "lobby" || phase === "question" || phase === "reveal"}
          isPlayingVictory={phase === "finished"}
        />
      </div>

      {/* ── PHÒNG CHỜ ── */}
      {phase === "lobby" && (
        <div className="lobby">
          <section className="lobby-join">
            <a className="back-link back-link-light" href={window.location.pathname}>
              ← Trang chủ
            </a>
            <p className="lobby-kicker">Quét mã QR hoặc vào trang và nhập mã phòng</p>
            <div className="qr-frame">
              {qrUrl && (
                <img src={qrUrl} alt={`Mã QR vào phòng ${roomCode}`} width="260" height="260" />
              )}
            </div>
            <div className="room-code" aria-label={`Mã phòng ${roomCode}`}>
              {roomCode.split("").map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
            <p className="join-url">{joinUrl.replace(/^https?:\/\//, "")}</p>
          </section>

          <section className="lobby-players">
            <header className="lobby-head">
              <h1 className="display">Giải mã con chữ</h1>
              <p className="muted">
                {quizData.length} câu · {TIME_LIMIT} giây mỗi câu · đúng liên tiếp có thưởng
              </p>
            </header>

            <div className="player-count">
              <strong>{players.length}</strong>
              <span>người đã vào phòng</span>
            </div>

            <ul className="chips">
              {players.length === 0 && (
                <li className="chips-empty">Chưa có ai. Mời cả lớp quét mã QR bên trái.</li>
              )}
              {players.map((p) => (
                <li key={p.id} className="chip">
                  <Avatar player={p} size={30} />
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>

            <button
              className="btn btn-red btn-xl"
              onClick={handleStart}
              disabled={players.length === 0}
            >
              {players.length === 0 ? "Đang chờ người chơi" : "Bắt đầu"}
            </button>
          </section>
        </div>
      )}

      {/* ── CÂU HỎI ── */}
      {phase === "question" && (
        <div className="stage">
          <header className="stage-bar">
            <ol className="progress" aria-label="Tiến độ">
              {quizData.map((_, i) => (
                <li
                  key={i}
                  className={i < currentQ ? "done" : i === currentQ ? "now" : ""}
                />
              ))}
            </ol>
            <span className="stage-count">
              Câu {currentQ + 1}/{quizData.length}
            </span>
            <span className={`diff diff-${q.difficulty === "Dễ" ? 1 : q.difficulty === "Khó" ? 3 : 2}`}>
              {q.difficulty}
            </span>
            <button className="btn btn-ghost" onClick={handleReveal}>
              Hiện đáp án
            </button>
          </header>

          <div className="stage-body">
            <section className="stage-main">
              <p className="q-type">
                {q.type === "choice" ? "Chọn đáp án đúng" : "Sắp xếp lại các chữ cái"}
              </p>
              <h2 className="q-text">{q.question}</h2>
              {q.type === "scramble" ? (
                <Tiles question={q} size="xl" />
              ) : (
                <ol className="options-board">
                  {q.options.map((opt, i) => (
                    <li key={i}>
                      <span className="opt-letter">{LETTERS[i]}</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <aside className="stage-side">
              <div className={`clock ${timeLeft <= 5 ? "is-low" : ""}`}>
                <span className="clock-num">{timeLeft}</span>
                <span className="clock-unit">giây</span>
              </div>
              <TimerBar timeLeft={timeLeft} total={TIME_LIMIT} />
              <div className="answered">
                <strong>
                  {answeredCount}/{players.length}
                </strong>
                <span>đã trả lời</span>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ── ĐÁP ÁN ── */}
      {phase === "reveal" && (
        <div className="stage">
          <header className="stage-bar">
            <ol className="progress" aria-label="Tiến độ">
              {quizData.map((_, i) => (
                <li key={i} className={i <= currentQ ? "done" : ""} />
              ))}
            </ol>
            <span className="stage-count">
              Đáp án câu {currentQ + 1}/{quizData.length}
            </span>
          </header>

          <div className="reveal">
            <section className="reveal-main">
              <p className="q-text q-text-sm">{q.question}</p>
              <div className="answer-plate">
                <Star size={34} className="plate-star" />
                <span>{q.correct}</span>
              </div>
              <p className="explain">{q.explain}</p>

              {q.type === "choice" ? (
                <ol className="dist">
                  {q.options.map((opt, i) => {
                    const n = answerList.filter((a) => a.answer === opt).length;
                    const pct = players.length ? (n / players.length) * 100 : 0;
                    const isRight = opt === q.correct;
                    return (
                      <li key={i} className={isRight ? "is-right" : ""}>
                        <span className="opt-letter">{LETTERS[i]}</span>
                        <span className="dist-bar">
                          <span style={{ width: `${pct}%` }} />
                        </span>
                        <span className="dist-n">
                          {n} {isRight ? "✓" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="tally">
                  <strong>{correctCount}</strong> đúng ·{" "}
                  <strong>{answerList.length - correctCount}</strong> sai ·{" "}
                  <strong>{Math.max(0, players.length - answerList.length)}</strong> chưa trả lời
                </p>
              )}
            </section>

            <section className="reveal-side">
              <h3 className="side-title">Bảng xếp hạng</h3>
              <ol className="ranks">
                {leaderboard.slice(0, 8).map((p, i) => {
                  const a = answers[p.id];
                  return (
                    <li key={p.id} className={i < 3 ? `top top-${i + 1}` : ""}>
                      <span className="rank-n">{i + 1}</span>
                      <RankMove prevRanks={prevRanks} id={p.id} index={i} />
                      <Avatar player={p} size={30} />
                      <span className="rank-name">{p.name}</span>
                      {a?.isCorrect && p.streak >= 2 && (
                        <span className="streak" title="Đúng liên tiếp">
                          🔥{p.streak}
                        </span>
                      )}
                      <span className={`gain ${a?.isCorrect ? "pos" : ""}`}>
                        {a ? (a.isCorrect ? `+${a.points}` : "+0") : ""}
                      </span>
                      <span className="rank-score">{p.score}</span>
                    </li>
                  );
                })}
              </ol>
              <button className="btn btn-red btn-xl" onClick={handleNext}>
                {currentQ < quizData.length - 1 ? "Câu tiếp theo" : "Xem kết quả chung cuộc"}
              </button>
            </section>
          </div>
        </div>
      )}

      {/* ── KẾT QUẢ ── */}
      {phase === "finished" && (
        <div className="final">
          <h1 className="display final-title">Chung cuộc</h1>
          <Podium players={leaderboard} />
          {leaderboard.length > 3 && (
            <ol className="ranks ranks-rest" start={4}>
              {leaderboard.slice(3, 12).map((p, i) => (
                <li key={p.id}>
                  <span className="rank-n">{i + 4}</span>
                  <Avatar player={p} size={28} />
                  <span className="rank-name">{p.name}</span>
                  <span className="rank-score">{p.score}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </main>
  );
}
