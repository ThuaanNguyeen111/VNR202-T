import { db } from "./config";
import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  off,
  remove,
  runTransaction,
} from "firebase/database";

// ─── Cấu hình trò chơi ────────────────────────────────────────────────────────
export const TIME_LIMIT = 30; // giây cho mỗi câu
const MAX_POINTS = 1000;
const MIN_POINTS = 100;
const HINT_PENALTY = 0.5; // dùng gợi ý thì chỉ nhận 50% điểm
const STREAK_STEP = 0.1; // mỗi câu đúng liên tiếp +10%
const STREAK_MAX = 0.3; // thưởng tối đa +30%

// ─── Đồng bộ giờ với máy chủ Firebase ────────────────────────────────────────
// Điện thoại và máy chiếu có thể lệch giờ vài giây; dùng giờ máy chủ để tính
// thời gian trả lời công bằng.
let serverOffset = 0;
onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
  serverOffset = snap.val() || 0;
});
export const now = () => Date.now() + serverOffset;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mã phòng gồm 6 chữ số: gõ trên điện thoại dễ, không bị bộ gõ tiếng Việt đổi chữ */
export const CODE_LENGTH = 6;
export function generateRoomCode() {
  let code = String(Math.floor(Math.random() * 9) + 1);
  for (let i = 1; i < CODE_LENGTH; i++) code += Math.floor(Math.random() * 10);
  return code;
}

/** Chỉ giữ lại chữ số, tối đa 6 số */
export function cleanRoomCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/** Chuẩn hóa để so đáp án: không phân biệt hoa/thường, khoảng trắng, dấu */
export function normalizeAnswer(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Điểm theo tốc độ: 1000 → 100 trong TIME_LIMIT giây */
export function calculatePoints(timeMs, isCorrect) {
  if (!isCorrect) return 0;
  const ratio = Math.max(0, 1 - timeMs / (TIME_LIMIT * 1000));
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * ratio);
}

// ─── Room lifecycle ───────────────────────────────────────────────────────────

export async function createRoom(totalQuestions) {
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) break;
    code = generateRoomCode();
  }

  await set(ref(db, `rooms/${code}`), {
    state: "lobby", // lobby | question | reveal | finished
    currentQuestion: 0,
    totalQuestions,
    questionStartTime: 0,
    createdAt: now(),
  });

  return code;
}

export async function deleteRoom(roomCode) {
  await remove(ref(db, `rooms/${roomCode}`));
}

// ─── Player management ────────────────────────────────────────────────────────

const PLAYER_COLORS = [
  "#CC0500", "#1F4E8C", "#2E7D32", "#B8860B", "#6A1B9A",
  "#00695C", "#C2185B", "#5D4037", "#E65100", "#283593",
];

export async function joinRoom(roomCode, playerName) {
  const roomSnap = await get(ref(db, `rooms/${roomCode}`));
  if (!roomSnap.exists()) throw new Error("Không tìm thấy phòng này. Kiểm tra lại mã phòng.");
  const roomData = roomSnap.val();
  if (roomData.state !== "lobby") throw new Error("Trò chơi đã bắt đầu, không thể vào thêm.");

  const playerRef = push(ref(db, `rooms/${roomCode}/players`));
  await set(playerRef, {
    name: playerName.trim(),
    score: 0,
    streak: 0,
    lastCorrectQ: -2,
    color: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
    joinedAt: now(),
    lastSeen: now(),
  });

  return { playerId: playerRef.key };
}

export async function pingPlayer(roomCode, playerId) {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
    lastSeen: now(),
  });
}

// ─── Game flow (host controls) ────────────────────────────────────────────────

export async function startGame(roomCode) {
  await update(ref(db, `rooms/${roomCode}`), {
    state: "question",
    currentQuestion: 0,
    questionStartTime: now(),
    revealedAnswer: null,
  });
}

export async function revealAnswer(roomCode, questionIndex, correctAnswer) {
  await update(ref(db, `rooms/${roomCode}`), {
    state: "reveal",
    revealedAnswer: correctAnswer,
  });
}

export async function nextQuestion(roomCode, nextIndex) {
  await update(ref(db, `rooms/${roomCode}`), {
    state: "question",
    currentQuestion: nextIndex,
    questionStartTime: now(),
    revealedAnswer: null,
  });
}

export async function endGame(roomCode) {
  await update(ref(db, `rooms/${roomCode}`), { state: "finished" });
}

// ─── Answer submission ────────────────────────────────────────────────────────

/**
 * Người chơi nộp đáp án.
 * Trả về { isCorrect, points, timeMs, streak, bonus }.
 */
export async function submitAnswer(
  roomCode,
  questionIndex,
  playerId,
  answer,
  correctAnswer,
  questionStartTime,
  usedHint = false
) {
  const timeMs = Math.max(0, now() - questionStartTime);
  const inTime = timeMs <= TIME_LIMIT * 1000 + 1500; // cho phép trễ mạng 1,5 giây
  const isCorrect =
    inTime && normalizeAnswer(answer) === normalizeAnswer(correctAnswer);

  let base = calculatePoints(timeMs, isCorrect);
  if (usedHint) base = Math.round(base * HINT_PENALTY);

  // Cập nhật điểm + chuỗi đúng liên tiếp trong một transaction
  let result = { streak: 0, bonus: 0, points: 0 };
  await runTransaction(
    ref(db, `rooms/${roomCode}/players/${playerId}`),
    (p) => {
      if (!p) return p;
      const continues = p.lastCorrectQ === questionIndex - 1;
      const streak = isCorrect ? (continues ? (p.streak || 0) + 1 : 1) : 0;
      const bonusRate = Math.min(STREAK_MAX, Math.max(0, streak - 1) * STREAK_STEP);
      const bonus = Math.round(base * bonusRate);
      result = { streak, bonus, points: base + bonus };
      return {
        ...p,
        score: (p.score || 0) + base + bonus,
        streak,
        lastCorrectQ: isCorrect ? questionIndex : p.lastCorrectQ ?? -2,
      };
    }
  );

  await set(ref(db, `rooms/${roomCode}/answers/${questionIndex}/${playerId}`), {
    answer: String(answer).trim(),
    isCorrect,
    points: result.points,
    bonus: result.bonus,
    streak: result.streak,
    usedHint,
    timeMs,
    submittedAt: now(),
  });

  return { isCorrect, timeMs, ...result };
}

// ─── Realtime listeners ───────────────────────────────────────────────────────

export function listenRoom(roomCode, callback) {
  const r = ref(db, `rooms/${roomCode}`);
  onValue(r, (snap) => callback(snap.val()));
  return () => off(r);
}

export function listenPlayers(roomCode, callback) {
  const r = ref(db, `rooms/${roomCode}/players`);
  onValue(r, (snap) => {
    const val = snap.val() || {};
    callback(Object.entries(val).map(([id, data]) => ({ id, ...data })));
  });
  return () => off(r);
}

export function listenAnswers(roomCode, questionIndex, callback) {
  const r = ref(db, `rooms/${roomCode}/answers/${questionIndex}`);
  onValue(r, (snap) => callback(snap.val() || {}));
  return () => off(r);
}

export async function checkRoom(roomCode) {
  const snap = await get(ref(db, `rooms/${roomCode}`));
  return snap.exists() ? snap.val() : null;
}
