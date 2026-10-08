import { useState, useEffect, useRef } from "react";
import { quizData, LETTERS } from "../data/quizData";
import {
  TIME_LIMIT,
  now,
  joinRoom,
  submitAnswer,
  listenRoom,
  pingPlayer,
  listenPlayers,
  CODE_LENGTH,
  cleanRoomCode,
} from "../firebase/gameService";
import { useConfetti, useSoundEffects } from "../hooks/useGameEffects";
import Confetti from "../components/Confetti";
import { Star, Tiles, Avatar, TimerBar, Podium } from "../components/ui";

const byScore = (a, b) => b.score - a.score || a.joinedAt - b.joinedAt;

export default function PlayerPage({ roomCode: initialRoomCode }) {
  const [phase, setPhase] = useState("join"); // join|waiting|question|result|finished
  const [codeInput, setCodeInput] = useState(initialRoomCode || "");
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const prevQRef = useRef(-1);
  const prevStateRef = useRef("");
  const resultRef = useRef(null);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const { particles, triggerConfetti } = useConfetti();
  const { playSound } = useSoundEffects();

  // ── Vào phòng ───────────────────────────────────────────────────────────
  const handleJoin = async (e) => {
    e?.preventDefault();
    const code = cleanRoomCode(codeInput);
    if (!name.trim() || code.length < CODE_LENGTH) return;
    setJoining(true);
    setError("");
    try {
      const { playerId: pid } = await joinRoom(code, name);
      setPlayerId(pid);
      setRoomCode(code);
      setPhase("waiting");
      playSound("click");
    } catch (err) {
      setError(err.message || "Không vào được phòng. Kiểm tra lại mã phòng.");
    } finally {
      setJoining(false);
    }
  };

  // ── Theo dõi phòng ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode || !playerId) return;
    const ping = setInterval(() => pingPlayer(roomCode, playerId), 10_000);

    const unsubRoom = listenRoom(roomCode, (data) => {
      if (!data) {
        setError("Phòng đã đóng.");
        return;
      }
      setRoom(data);
      const prevState = prevStateRef.current;

      if (data.state === "question" && data.currentQuestion !== prevQRef.current) {
        prevQRef.current = data.currentQuestion;
        setAnswer("");
        setPicked(null);
        setSubmitted(false);
        setUsedHint(false);
        setResult(null);
        setPhase("question");
      }
      if (data.state === "reveal" && prevState !== "reveal") {
        setPhase("result");
        if (resultRef.current?.isCorrect) {
          triggerConfetti(50);
          playSound("correct");
        } else {
          playSound("wrong");
        }
      }
      if (data.state === "finished" && prevState !== "finished") {
        setPhase("finished");
        triggerConfetti(90);
        playSound("victory");
      }
      prevStateRef.current = data.state;
    });

    const unsubPlayers = listenPlayers(roomCode, (list) => setPlayers(list.sort(byScore)));

    return () => {
      clearInterval(ping);
      unsubRoom();
      unsubPlayers();
    };
  }, [roomCode, playerId]); // eslint-disable-line

  // ── Đồng hồ ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "question" || !room?.questionStartTime) return;
    const tick = () =>
      setTimeLeft(
        Math.max(0, TIME_LIMIT - Math.floor((now() - room.questionStartTime) / 1000))
      );
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, room?.questionStartTime]);

  // ── Nộp đáp án ──────────────────────────────────────────────────────────
  const send = async (value) => {
    if (submitted || !room || !String(value).trim() || timeLeft === 0) return;
    setSubmitted(true);
    playSound("click");
    try {
      const r = await submitAnswer(
        roomCode,
        room.currentQuestion,
        playerId,
        value,
        quizData[room.currentQuestion].correct,
        room.questionStartTime,
        usedHint
      );
      setResult(r);
    } catch (err) {
      console.error(err);
      setSubmitted(false);
      setError("Gửi đáp án thất bại, thử lại.");
    }
  };

  const q = room ? quizData[room.currentQuestion] : null;
  const me = players.find((p) => p.id === playerId);
  const myRank = players.findIndex((p) => p.id === playerId) + 1;

  return (
    <main className="player">
      <Confetti particles={particles} />

      {/* ── VÀO PHÒNG ── */}
      {phase === "join" && (
        <form className="p-join" onSubmit={handleJoin}>
          <a className="back-link" href={window.location.pathname}>
            ← Trang chủ
          </a>
          <Star size={56} className="p-join-star" />
          <h1 className="display p-join-title">Giải mã con chữ</h1>
          <p className="muted">Ôn tập HCM202 · Chương VI, mục IV</p>

          <label htmlFor="p-code">Mã phòng</label>
          <input
            id="p-code"
            className="field field-code"
            value={codeInput}
            onChange={(e) => setCodeInput(cleanRoomCode(e.target.value))}
            placeholder="6 chữ số"
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
          />

          <label htmlFor="p-name">Tên của bạn</label>
          <input
            id="p-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên hiện trên bảng xếp hạng"
            maxLength={20}
            autoFocus={!!initialRoomCode}
            autoComplete="off"
          />

          {error && <p className="form-error" role="alert">{error}</p>}

          <button
            className="btn btn-red btn-block"
            disabled={joining || !name.trim() || codeInput.length < CODE_LENGTH}
          >
            {joining ? "Đang vào phòng…" : "Vào phòng"}
          </button>
        </form>
      )}

      {/* ── CHỜ ── */}
      {phase === "waiting" && (
        <div className="p-wait">
          {me && <Avatar player={me} size={84} />}
          <h1 className="display">{name}</h1>
          <p>Bạn đã vào phòng <strong>{roomCode}</strong>.</p>
          <p className="muted">Nhìn lên màn chiếu, trò chơi sẽ bắt đầu ngay.</p>
          <p className="p-wait-count">{players.length} người đang chờ</p>
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      {/* ── CÂU HỎI ── */}
      {phase === "question" && q && (
        <div className="p-q">
          <div className="p-q-top">
            <TimerBar timeLeft={timeLeft} total={TIME_LIMIT} />
            <div className="p-q-meta">
              <span>
                Câu {room.currentQuestion + 1}/{quizData.length}
              </span>
              <span className={`p-clock ${timeLeft <= 5 ? "is-low" : ""}`}>{timeLeft}s</span>
            </div>
          </div>

          <h2 className="p-q-text">{q.question}</h2>

          {submitted ? (
            <div className="p-sent">
              <Star size={40} className="p-sent-star" />
              <p className="p-sent-title">Đã ghi nhận đáp án</p>
              <p className="p-sent-answer">“{q.type === "choice" ? picked : answer}”</p>
              <p className="muted">Đáp án sẽ hiện trên màn chiếu.</p>
            </div>
          ) : timeLeft === 0 ? (
            <div className="p-sent">
              <p className="p-sent-title">Hết giờ</p>
              <p className="muted">Chờ đáp án trên màn chiếu.</p>
            </div>
          ) : q.type === "choice" ? (
            <div className="p-options">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  className="p-option"
                  onClick={() => {
                    setPicked(opt);
                    send(opt);
                  }}
                >
                  <span className="opt-letter">{LETTERS[i]}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <form
              className="p-scramble"
              onSubmit={(e) => {
                e.preventDefault();
                send(answer);
              }}
            >
              <Tiles question={q} size="md" hintFirst={usedHint} />
              <label htmlFor="p-ans" className="sr-only">
                Đáp án
              </label>
              <input
                id="p-ans"
                className="field"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Gõ đáp án (không dấu cũng được)"
                autoComplete="off"
                autoCapitalize="off"
                autoFocus
              />
              <div className="p-scramble-actions">
                {!usedHint && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setUsedHint(true)}
                  >
                    Gợi ý (−50% điểm)
                  </button>
                )}
                <button className="btn btn-red" disabled={!answer.trim()}>
                  Gửi đáp án
                </button>
              </div>
            </form>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      {/* ── KẾT QUẢ TỪNG CÂU ── */}
      {phase === "result" && q && (
        <div className={`p-result ${result?.isCorrect ? "is-right" : "is-wrong"}`}>
          <p className="p-result-verdict">
            {result ? (result.isCorrect ? "Chính xác!" : "Chưa đúng") : "Bạn chưa trả lời"}
          </p>
          {result?.isCorrect && (
            <p className="p-result-points">
              +{result.points}
              {result.bonus > 0 && (
                <span className="p-bonus">
                  gồm {result.bonus} điểm thưởng 🔥 {result.streak} câu liên tiếp
                </span>
              )}
            </p>
          )}
          <div className="p-result-answer">
            <span className="muted">Đáp án đúng</span>
            <strong>{q.correct}</strong>
          </div>
          <p className="explain">{q.explain}</p>
          <div className="p-result-foot">
            <span>
              Tổng điểm <strong>{me?.score ?? 0}</strong>
            </span>
            {myRank > 0 && (
              <span>
                Hạng <strong>{myRank}</strong>/{players.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── CHUNG CUỘC ── */}
      {phase === "finished" && (
        <div className="p-final">
          <h1 className="display">Chung cuộc</h1>
          {myRank > 0 && (
            <p className="p-final-me">
              Bạn đứng hạng <strong>{myRank}</strong> với <strong>{me?.score ?? 0}</strong> điểm
            </p>
          )}
          <Podium players={players} selfId={playerId} />
          <a className="btn btn-ghost" href={window.location.pathname}>
            Về trang chủ
          </a>
        </div>
      )}
    </main>
  );
}
