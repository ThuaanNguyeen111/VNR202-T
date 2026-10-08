import { getScrambledWords } from "../data/quizData";


export function Star({ size = 40, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <polygon
        fill="currentColor"
        points="50,4 61.8,38.2 97.6,38.2 68.6,59.4 79.4,93.6 50,72.4 20.6,93.6 31.4,59.4 2.4,38.2 38.2,38.2"
      />
    </svg>
  );
}

/** Các "con chữ" bị xáo trộn, hiển thị như chữ in rời */
export function Tiles({ question, size = "lg", hintFirst = false }) {
  const words = getScrambledWords(question);
  const firstLetters = question.correct
    .toLowerCase()
    .split(/\s+/)
    .map((w) => Array.from(w)[0]);
  return (
    <div className={`tiles tiles-${size}`} aria-label="Các chữ cái bị xáo trộn">
      {words.map((chars, wi) => (
        <div className="tile-word" key={wi}>
          {chars.map((ch, ci) => (
            <span
              key={ci}
              className="tile"
              style={{
                "--tilt": `${(((wi * 7 + ci * 13) % 7) - 3) * 1.2}deg`,
                "--d": `${(wi * 5 + ci) * 45}ms`,
              }}
            >
              {ch}
            </span>
          ))}
          {hintFirst && (
            <span className="tile-hint">
              bắt đầu bằng “{firstLetters[wi]}”, {chars.length} chữ cái
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function Avatar({ player, size = 40 }) {
  return (
    <span
      className="avatar"
      style={{ background: player.color, width: size, height: size, fontSize: size * 0.45 }}
    >
      {(player.name || "?")[0].toUpperCase()}
    </span>
  );
}

export function TimerBar({ timeLeft, total }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / total) * 100));
  return (
    <div className={`timer-bar ${timeLeft <= 5 ? "is-low" : ""}`}>
      <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Podium({ players, selfId }) {
  const order = [players[1], players[0], players[2]];
  const place = [2, 1, 3];
  return (
    <div className="podium">
      {order.map((p, i) =>
        p ? (
          <div
            key={p.id}
            className={`podium-col place-${place[i]} ${p.id === selfId ? "is-self" : ""}`}
          >
            {place[i] === 1 && <Star size={44} className="podium-star" />}
            <Avatar player={p} size={place[i] === 1 ? 72 : 56} />
            <div className="podium-name">{p.name}</div>
            <div className="podium-score">{p.score} điểm</div>
            <div className="podium-block">
              <span>{place[i]}</span>
            </div>
          </div>
        ) : (
          <div key={`empty-${i}`} className="podium-col is-empty" />
        )
      )}
    </div>
  );
}

export function RankMove({ prevRanks, id, index }) {
  if (!prevRanks || prevRanks[id] === undefined) return <span className="move" />;
  const diff = prevRanks[id] - index;
  if (diff > 0) return <span className="move up" title={`Tăng ${diff} hạng`}>▲{diff}</span>;
  if (diff < 0) return <span className="move down" title={`Giảm ${-diff} hạng`}>▼{-diff}</span>;
  return <span className="move same" aria-label="Giữ hạng">–</span>;
}
