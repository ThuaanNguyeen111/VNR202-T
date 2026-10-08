// =====================================================
// BỘ CÂU HỎI HCM202 – Chương VI, mục IV
// Hai dạng câu hỏi:
//   type: "scramble" → người chơi gõ đáp án (chữ bị xáo trộn tự động)
//   type: "choice"   → người chơi chọn 1 trong 4 phương án
// "correct" phải trùng y hệt 1 phương án trong "options" (với dạng choice).
// "explain" hiện ra khi host bấm "Hiện đáp án".
// =====================================================

export const LETTERS = ["A", "B", "C", "D"];

export const quizData = [
  {
    id: 1,
    type: "choice",
    difficulty: "Dễ",
    question:
      "Theo Nghị quyết Trung ương 5 khóa VIII, văn hóa là nền tảng tinh thần của xã hội, vừa là mục tiêu vừa là…",
    options: [
      "Công cụ quản lý xã hội",
      "Động lực thúc đẩy sự phát triển kinh tế – xã hội",
      "Kết quả tự nhiên của tăng trưởng kinh tế",
      "Lĩnh vực riêng của đội ngũ trí thức",
    ],
    correct: "Động lực thúc đẩy sự phát triển kinh tế – xã hội",
    explain:
      "Văn hóa vừa là mục tiêu vừa là động lực, nên không thể đứng ngoài kinh tế (Giáo trình, Chương VI, mục IV.1).",
  },
  {
    id: 2,
    type: "scramble",
    difficulty: "Dễ",
    question:
      "Hoàn thành câu: “Văn hóa còn thì … còn, văn hóa mất thì … mất.”",
    correct: "Chế độ",
    explain:
      "“Văn hóa còn thì chế độ còn, văn hóa mất thì chế độ mất; không gì đáng sợ bằng văn hóa lâm nguy” (Giáo trình, mục IV.1).",
  },
  {
    id: 3,
    type: "choice",
    difficulty: "Trung bình",
    question:
      "Cương lĩnh năm 2011 khẳng định: con người là trung tâm của chiến lược phát triển, đồng thời là…",
    options: [
      "Đối tượng chịu sự quản lý",
      "Nguồn lao động phổ thông",
      "Chủ thể phát triển",
      "Người thụ hưởng thành quả",
    ],
    correct: "Chủ thể phát triển",
    explain:
      "Con người không chỉ được hưởng lợi mà phải là người làm chủ quá trình phát triển (Giáo trình, mục IV.1).",
  },
  {
    id: 4,
    type: "scramble",
    difficulty: "Trung bình",
    question:
      "Hồ Chí Minh nói: “Dễ trăm lần không dân cũng chịu, khó vạn lần dân … cũng xong.”",
    correct: "Liệu",
    explain:
      "Câu nói thể hiện quan điểm con người là động lực, nhân tố quyết định thành công (Giáo trình, Chương VI, mục III).",
  },
  {
    id: 5,
    type: "scramble",
    difficulty: "Dễ",
    question:
      "“Vì lợi ích mười năm thì phải trồng cây, vì lợi ích trăm năm thì phải …”",
    correct: "Trồng người",
    explain:
      "Xây dựng con người là sự nghiệp lâu dài, cần tiến hành thường xuyên (Giáo trình, Chương VI, mục III).",
  },
  {
    id: 6,
    type: "choice",
    difficulty: "Khó",
    question:
      "Trong tình huống dự án du lịch miền núi, giải pháp nào thể hiện rõ nhất quan điểm “con người là động lực”?",
    options: [
      "Xây thêm resort và mở rộng sân bay",
      "Tuyển thêm lao động phổ thông với lương cao hơn",
      "Để người dân cùng bàn bạc, làm du lịch cộng đồng và cùng hưởng lợi",
      "Tách hẳn khu du lịch khỏi bản làng cho yên tĩnh",
    ],
    correct:
      "Để người dân cùng bàn bạc, làm du lịch cộng đồng và cùng hưởng lợi",
    explain:
      "Chỉ khi người dân là chủ thể – được bàn, được làm, được hưởng – thì dự án mới có động lực để bền vững.",
  },
];

// ── Tự xáo trộn chữ cho câu dạng "scramble" ─────────────────────────────────
// Xáo theo hạt giống cố định (id câu hỏi) để host và người chơi thấy giống nhau.
function seededShuffle(chars, seed) {
  const arr = [...chars];
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Trả về mảng các từ, mỗi từ là mảng ký tự đã xáo. */
export function getScrambledWords(q) {
  return q.correct
    .toLowerCase()
    .normalize("NFC")
    .split(/\s+/)
    .map((word, wi) => {
      const chars = Array.from(word);
      if (chars.length < 2) return chars;
      let out = seededShuffle(chars, q.id * 31 + wi + 1);
      let tries = 1;
      while (out.join("") === word && tries < 6) {
        out = seededShuffle(chars, q.id * 31 + wi + 1 + tries * 7);
        tries++;
      }
      if (out.join("") === word) out = [...chars.slice(1), chars[0]];
      return out;
    });
}
