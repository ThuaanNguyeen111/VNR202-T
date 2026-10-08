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
      "Đại hội XIII của Đảng chỉ ra hạn chế nào trong xây dựng văn hóa hiện nay?",
    options: [
      "Văn hóa phát triển vượt trước kinh tế, gây mất cân đối trong đầu tư",
      "Văn hóa chưa được quan tâm tương xứng với kinh tế và chính trị, chưa thật sự trở thành nguồn lực, động lực nội sinh",
      "Văn hóa chỉ được quan tâm ở đô thị, còn nông thôn bị bỏ ngỏ hoàn toàn",
      "Văn hóa đã bị thương mại hóa hoàn toàn, mất hết giá trị truyền thống",
    ],
    correct:
      "Văn hóa chưa được quan tâm tương xứng với kinh tế và chính trị, chưa thật sự trở thành nguồn lực, động lực nội sinh",
    explain:
      "Đại hội XIII cũng nêu: đời sống văn hóa ở vùng đồng bào dân tộc thiểu số, vùng sâu, vùng xa còn nhiều khó khăn – đúng bối cảnh tình huống (Giáo trình, mục IV).",
  },
  {
    id: 2,
    type: "scramble",
    difficulty: "Trung bình",
    question:
      "“Muôn việc thành công hay thất bại của cá nhân, tổ chức, cộng đồng, đất nước đều do có văn hóa hay … về văn hóa.”",
    correct: "Tha hóa",
    explain:
      "Văn hóa là nền tảng tinh thần của xã hội; vì vậy phải giải quyết đúng mối quan hệ giữa văn hóa với kinh tế, chính trị, xã hội (Giáo trình, mục IV.1).",
  },
  {
    id: 3,
    type: "choice",
    difficulty: "Trung bình",
    question:
      "Cương lĩnh năm 2011 khẳng định: con người là trung tâm của chiến lược phát triển, đồng thời là…",
    options: [
      "Mục tiêu duy nhất của phát triển",
      "Đối tượng phục vụ của Nhà nước",
      "Nguồn lao động của doanh nghiệp",
      "Chủ thể phát triển",
    ],
    correct: "Chủ thể phát triển",
    explain:
      "“Chủ thể” nghĩa là người dân không chỉ được hưởng lợi mà phải được tham gia, làm chủ quá trình phát triển (Giáo trình, mục IV.1).",
  },
  {
    id: 4,
    type: "scramble",
    difficulty: "Trung bình",
    question:
      "Nghị quyết 33-NQ/TW (2014) và Đại hội XIII định hướng để văn hóa, con người Việt Nam trở thành sức mạnh …, động lực phát triển đất nước.",
    correct: "Nội sinh",
    explain:
      "Đại hội XIII: con người Việt Nam là “trung tâm, mục tiêu và động lực phát triển quan trọng nhất của đất nước” (Giáo trình, mục IV.1).",
  },
  {
    id: 5,
    type: "choice",
    difficulty: "Trung bình",
    question:
      "Câu hỏi “Phát triển để làm gì, vì ai?” gắn trực tiếp với quan điểm nào?",
    options: [
      "Con người là động lực của phát triển",
      "Con người là mục tiêu của phát triển",
      "Văn hóa là một mặt trận",
      "Đạo đức là gốc của người cách mạng",
    ],
    correct: "Con người là mục tiêu của phát triển",
    explain:
      "“Mục tiêu” trả lời phát triển để làm gì – vì con người; “động lực” trả lời phát triển nhờ ai – bởi con người.",
  },
  {
    id: 6,
    type: "scramble",
    difficulty: "Dễ",
    question:
      "Hồ Chí Minh nói: “Dễ trăm lần không dân cũng chịu, khó vạn lần dân … cũng xong.”",
    correct: "Liệu",
    explain:
      "Theo Hồ Chí Minh, con người là vốn quý nhất, là động lực, nhân tố quyết định thành công (Giáo trình, Chương VI, mục III).",
  },
  {
    id: 7,
    type: "scramble",
    difficulty: "Trung bình",
    question:
      "Hồ Chí Minh nhắc: “Hiền, dữ phải đâu là tính sẵn, phần nhiều do … mà nên.”",
    correct: "Giáo dục",
    explain:
      "Con người được hình thành chủ yếu qua giáo dục, nên xây dựng con người phải bắt đầu từ giáo dục (Giáo trình, Chương VI, mục III).",
  },
  {
    id: 8,
    type: "choice",
    difficulty: "Khó",
    question:
      "Trong tình huống, chi tiết “một bộ phận thanh niên bỏ học chạy theo việc ngắn hạn” đi ngược trực tiếp nhất với nội dung nào?",
    options: [
      "Quan điểm văn hóa là một mặt trận, là sự nghiệp lâu dài",
      "Nhiệm vụ chủ động hội nhập quốc tế về văn hóa",
      "Tư tưởng “trồng người” và mục tiêu phát triển con người toàn diện",
      "Nhiệm vụ phát triển công nghiệp văn hóa và thị trường văn hóa",
    ],
    correct:
      "Tư tưởng “trồng người” và mục tiêu phát triển con người toàn diện",
    explain:
      "“Vì lợi ích trăm năm thì phải trồng người”; Đại hội XII: xây dựng con người phát triển toàn diện là mục tiêu của chiến lược phát triển.",
  },
  {
    id: 9,
    type: "choice",
    difficulty: "Khó",
    question:
      "Trong 8 nhiệm vụ Đại hội XII nêu, nhiệm vụ nào phù hợp nhất để khắc phục việc khu resort tách biệt, bỏ quên văn hóa bản địa?",
    options: [
      "Xây dựng văn hóa trong chính trị và kinh tế",
      "Làm tốt công tác lãnh đạo, quản lý báo chí, xuất bản",
      "Chủ động hội nhập quốc tế về văn hóa",
      "Đổi mới phương thức lãnh đạo của Đảng đối với văn hóa",
    ],
    correct: "Xây dựng văn hóa trong chính trị và kinh tế",
    explain:
      "Làm kinh tế cũng phải có văn hóa: tôn trọng, gìn giữ và để cộng đồng hưởng lợi từ văn hóa bản địa (Giáo trình, mục IV.1).",
  },
  {
    id: 10,
    type: "choice",
    difficulty: "Khó",
    question:
      "Phẩm chất đạo đức cách mạng nào đòi hỏi chính quyền đặt lợi ích nhân dân lên trên, không chạy theo thành tích “nâng tầm địa phương”?",
    options: [
      "Khiêm tốn",
      "Chí công vô tư",
      "Ý chí, nghị lực",
      "Tinh thần quốc tế trong sáng",
    ],
    correct: "Chí công vô tư",
    explain:
      "Cần, kiệm, liêm, chính, chí công vô tư là cốt lõi đạo đức cách mạng; Người dạy: “Việc gì có lợi cho dân, dù nhỏ, cũng phải hết sức làm” (Giáo trình, mục IV.2).",
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
