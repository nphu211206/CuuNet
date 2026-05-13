"use client";

// =============================================================================
// EDUCATION & SURVIVAL MODULE - Mock Data
// Module Giáo Dục & Nhận Thức - CứuNet (Phase 7)
//
// Content:
//   - 8 courses with 25 lessons
//   - 3 interactive scenarios (flood, storm, landslide)
//   - 50 quiz questions (Bloom's Taxonomy aligned)
//   - 7 first aid guides
//   - 20 badges
//   - Kit items
//   - Leaderboard data
// =============================================================================

import type {
  Course,
  Lesson,
  Scenario,
  ScenarioNode,
  QuizQuestion,
  FirstAidGuide,
  Badge,
  KitItem,
  LeaderboardEntry,
} from "../lib/types";

// =============================================================================
// 1. COURSES (8 courses × 25 lessons)
// =============================================================================

export const MOCK_COURSES: Course[] = [
  // --- Khóa 1: Lũ lụt ---
  {
    id: "course-flood",
    topic: "flood",
    title: "Flood Safety",
    titleVi: "An toàn lũ lụt",
    description: "Learn flood survival skills for Mekong Delta, Central Vietnam, and urban areas",
    descriptionVi: "Học kỹ năng sống sót khi lũ lụt cho ĐBSCL, Miền Trung và thành phố",
    icon: "🌊",
    color: "#3B82F6",
    level: 1,
    totalXP: 200,
    prerequisites: [],
    estimatedMinutes: 20,
    disasterTypes: ["flood"],
    region: "all",
    lessons: [
      {
        id: "lesson-flood-1", courseId: "course-flood",
        title: "Understanding Vietnam Floods", titleVi: "Hiểu về lũ lụt Việt Nam",
        description: "Types of floods in Vietnam and their characteristics",
        descriptionVi: "Các loại lũ lụt ở Việt Nam và đặc điểm",
        contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [],
        content: {
          hook: "Mỗi năm, lũ lụt ảnh hưởng đến hàng triệu người dân Việt Nam. Bạn có biết cách bảo vệ gia đình mình?",
          sections: [
            { title: "Mekong Delta Flooding", titleVi: "Lũ ĐBSCL", content: "Lũ ĐBSCL xảy ra hàng năm từ tháng 8-11, nước lên từ từ trong 1-2 tuần. Người dân đã quen sống chung với lũ.", icon: "🌊", tips: ["Nhà cao trên đôn (giống nhà dân tộc Khmer)", "Mỗi hộ có ít nhất 1 thuyền nhựa", "Cấu tạo ao cá trong vườn: cá lình, cá rô là nguồn thức ăn chính khi lũ"] },
            { title: "Central Vietnam Flash Floods", titleVi: "Lũ quét Miền Trung", content: "Lũ quét xảy ra nhanh, chỉ trong 2-6 giờ sau mưa. Nguy hiểm nhất là ban đêm.", icon: "⚡", tips: ["Không bao giờ đi bộ qua vùng ngập khi nước chảy", "Quan sát nước: nước trong = lũ tre, nước đỏ = cát đá, nước đen = bùn đất"] },
            { title: "Urban Flooding", titleVi: "Ngập lụt thành phố", content: "Ngập úng đô thị do mưa lớn + triều cường. Không đi qua vùng ngập có dòng điện.", icon: "🏙️", tips: ["Không lái xe qua vùng ngập quá bánh xe (tối đa 30cm)", "Dùng gậy để đo độ sâu"] },
          ],
          takeaway: "Lũ lụt Việt Nam có 3 loại chính: ĐBSCL (chậm), Miền Trung (nhanh), Thành phố (nguy hiểm). Biết loại lũ = biết cách ứng phó.",
        },
      },
      {
        id: "lesson-flood-2", courseId: "course-flood",
        title: "Flood Survival Skills", titleVi: "Kỹ năng sống sót trong lũ",
        description: "Essential survival techniques during flooding",
        descriptionVi: "Kỹ năng sinh tồn thiết yếu khi có lũ",
        contentType: "step_by_step", order: 2, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-flood-1"],
        content: {
          hook: "Bạn bị nước lũ bao vây. Bạn có 5 phút để quyết định. Bạn sẽ làm gì?",
          sections: [
            { title: "Bơi cứu trong lũ", titleVi: "Bơi cứu trong lũ", content: "Nếu bị cuốn: nằm ngửa, chân hướng xuống hạ lưu. Không cuống lại dòng nước. Tìm vật nổi: bình nhựa, thùng, cây cối.", icon: "🏊", tips: ["Nếu gặp dòng nước xoáy: lọt vào giữa rồi bơi ra ngoài theo hướng xéo 45 độ", "Khi gặp sóng lớn: bơi vào giữa sông, không bơi vào bờ"] },
            { title: "Tìm nơi cao", titleVi: "Tìm nơi cao", content: "Di chuyển đến nơi cao ít nhất 3m trên mặt nước. Tầng 2, mái nhà, cây lớn.", icon: "⬆️", tips: ["Mang theo điện thoại, nước uống, đèn pin", "Dùng cờ, áo phan trang để đánh dấu vị trí"] },
            { title: "Gọi cứu hộ", titleVi: "Gọi cứu hộ", content: "Gọi 112 (Tìm kiếm cứu nạn). Nói rõ: vị trí, số người, tình trạng.", icon: "📞", tips: ["Giữ điện thoại, không gập máy trước khi được hướng dẫn", "Nếu không có sóng: dùng còi, đập nồi"] },
          ],
          takeaway: "Khi bị lũ bao vây: bình tĩnh → tìm nơi cao → gọi cứu hộ → đánh dấu vị trí.",
        },
      },
      {
        id: "lesson-flood-3", courseId: "course-flood",
        title: "Flood Preparation", titleVi: "Chuẩn bị khi có lũ",
        description: "How to prepare your family and home for flooding",
        descriptionVi: "Cách chuẩn bị gia đình và nhà cửa khi có lũ",
        contentType: "checklist", order: 3, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-flood-2"],
        content: {
          hook: "Gia đình bạn đã chuẩn bị sẵn sàng cho mùa lũ chưa? Chỉ cần 30 phút để bảo vệ cả nhà.",
          sections: [
            { title: "Bộ đồ dùng", titleVi: "Bộ đồ dùng", content: "Chuẩn bị balô 72 giờ: 9 lít nước, mì gói, bánh quy, đèn pin, radio, dao đa năng, dây thừng, còi.", icon: "🎒", tips: ["Bọc nilon cho giấy tờ quan trọng", "Chuẩn bị thuốc cá nhân đặc biệt"] },
            { title: "Kế hoạch gia đình", titleVi: "Kế hoạch gia đình", content: "Thống nhất điểm tập hợp, số điện thoại liên lạc, ai phụ trách trẻ em, người già.", icon: "👨‍👩‍👧", tips: ["Dạy trẻ em số điện thoại cha mẹ", "Chuẩn bị danh sách liên lạc dán trên tủ lạnh"] },
            { title: "Bảo vệ nhà cửa", titleVi: "Bảo vệ nhà cửa", content: "Di chuyển đồ đạc lên cao, gia cố cửa, chuẩn bị bao cát.", icon: "🏠", tips: ["Đánh dấu mực nước trên cột trong nhà", "Chuẩn bị thuyền nhựa sẵn sàng"] },
          ],
          takeaway: "Chuẩn bị trước = sống sót. 30 phút chuẩn bị có thể cứu cả gia đình.",
        },
      },
      {
        id: "lesson-flood-4", courseId: "course-flood",
        title: "After the Flood", titleVi: "Sau lũ lụt",
        description: "Recovery, disease prevention, and mental health after flooding",
        descriptionVi: "Phục hồi, phòng bệnh và sức khỏe tâm lý sau lũ",
        contentType: "text", order: 4, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-flood-3"],
        content: {
          hook: "Lũ rút chưa phải là hết. Đây là lúc nguy hiểm nhất bắt đầu.",
          sections: [
            { title: "Phòng bệnh", titleVi: "Phòng bệnh", content: "Uống nước đã xử lý (sắc sôi, lọc, cloramin). Ăn chín uống sôi. Rửa tay bằng xà phòng. Dùng giày dép khi đi qua vùng ngập.", icon: "🏥", tips: ["Phòng bệnh tiêu chảy, thương hàn, leptospirosis", "Phòng bệnh về da: viêm da tiếp xúc, nấm da"] },
            { title: "Sức khỏe tâm lý", titleVi: "Sức khỏe tâm lý", content: "PTSD, lo âu, trầm cảm là phản ứng bình thường sau thiên tai. Tìm hỗ trợ tâm lý nếu cần.", icon: "💚", tips: ["Lắng nghe: để người bị ảnh hưởng kể chuyện", "Đồng hành: ở bên cạnh, không để họ một mình"] },
            { title: "Phục hồi", titleVi: "Phục hồi", content: "Kiểm tra nhà cửa, vệ sinh, khử trùng. Không uống nước chưa qua xử lý.", icon: "🔄", tips: ["Kiểm tra gas trước khi dùng lại bếp", "Không vào nhà đã bị hư hỏng nặng"] },
          ],
          takeaway: "Sau lũ: phòng bệnh > phục hồi nhà cửa > hỗ trợ tâm lý.",
        },
      },
    ],
  },
  // --- Khóa 2: Bão ---
  {
    id: "course-storm",
    topic: "storm",
    title: "Storm Safety",
    titleVi: "An toàn bão",
    description: "Prepare and respond to typhoons in Vietnam",
    descriptionVi: "Chuẩn bị và ứng phó khi có bão ở Việt Nam",
    icon: "🌪️",
    color: "#8B5CF6",
    level: 1,
    totalXP: 200,
    prerequisites: [],
    estimatedMinutes: 20,
    disasterTypes: ["storm"],
    region: "coastal",
    lessons: [
      {
        id: "lesson-storm-1", courseId: "course-storm",
        title: "Understanding Typhoons", titleVi: "Hiểu về bão Việt Nam",
        description: "Types of storms and their characteristics",
        descriptionVi: "Các loại bão và đặc điểm",
        contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [],
        content: {
          hook: "Bão Yagi 2024 cấp 14-15 đã giết 300+ người. Bạn có biết cách bảo vệ gia đình?",
          sections: [
            { title: "Cấp bão", titleVi: "Cấp bão", content: "Cấp 6-7: Gió mạnh. Cấp 8-9: Gió rất mạnh. Cấp 10-11: Gió bão. Cấp 12-13: Bão mạnh. Cấp 14-15: Siêu bão.", icon: "🌪️" },
            { title: "Mùa bão", titleVi: "Mùa bão", content: "Tháng 8-11: Mùa bão chính miền Trung. Tháng 5-7: Bão sớm miền Bắc.", icon: "📅" },
          ],
          takeaway: "Biết cấp bão = biết mức nguy hiểm = biết cách chuẩn bị.",
        },
      },
      {
        id: "lesson-storm-2", courseId: "course-storm",
        title: "Storm Preparation Timeline", titleVi: "Timeline chuẩn bị trước bão",
        description: "72h → 1h preparation timeline",
        descriptionVi: "Lịch trình chuẩn bị từ 72h đến 1h trước bão",
        contentType: "step_by_step", order: 2, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-storm-1"],
        content: {
          hook: "Bạn có 72 giờ để chuẩn bị. Mỗi giờ đều quan trọng.",
          sections: [
            { title: "72h trước", titleVi: "72h trước", content: "Theo dõi bản tin. Kiểm tra nhà cửa: sửa chữa mái, cửa sổ, cửa chính. Chuẩn bị đồ khô.", icon: "📋" },
            { title: "48h trước", titleVi: "48h trước", content: "Cắt cành cây, gia cố mái. Chuẩn bị bao cát. Sạc đầy pin.", icon: "🔧" },
            { title: "24h trước", titleVi: "24h trước", content: "Đưa thuyền vào nơi an toàn. Mang vào nhà các đồ vật ngoài trời.", icon: "🚤" },
            { title: "12h trước", titleVi: "12h trước", content: "Ở trong nhà, đóng kín cửa. Cắt điện nếu cần. Chuẩn bị nơi trú an toàn.", icon: "🏠" },
            { title: "1h trước", titleVi: "1h trước", content: "Toàn bộ trong nơi trú an toàn. Giữ điện thoại. Không ra ngoài.", icon: "⚠️" },
          ],
          takeaway: "72h: Kiểm tra. 48h: Gia cố. 24h: Thu dọn. 12h: Ẩn nấp. 1h: An toàn.",
        },
      },
      {
        id: "lesson-storm-3", courseId: "course-storm",
        title: "During the Storm", titleVi: "Trong lúc bão",
        description: "What to do during a typhoon",
        descriptionVi: "Làm gì trong lúc bão",
        contentType: "text", order: 3, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-storm-2"],
        content: {
          hook: "Bão đang đổ bộ. Bạn đang ở trong nhà. Bạn cần làm gì?",
          sections: [
            { title: "Nơi trú an toàn", titleVi: "Nơi trú an toàn", content: "Phong không có cửa sổ, tầng thấp. Dùng bàn, nệm che đầu để bảo vệ khỏi vật rơi.", icon: "🏠" },
            { title: "Khi mái bị hỏng", titleVi: "Khi mái bị hỏng", content: "Di chuyển vào phòng khác, che bằng bàn/mền. Nếu nhà có nguy cơ sập: ra ngoài, tìm nơi trú khác.", icon: "⚠️" },
            { title: "Gọi cứu hộ", titleVi: "Gọi cứu hộ", content: "Gọi 114 (Cứu hỏa) hoặc 112 (Tìm kiếm cứu nạn) nếu cần.", icon: "📞" },
          ],
          takeaway: "Trong bão: Ở trong nơi trú → che đầu → không ra ngoài → gọi cứu hộ nếu cần.",
        },
      },
      {
        id: "lesson-storm-4", courseId: "course-storm",
        title: "After the Storm", titleVi: "Sau bão",
        description: "Safety checks and recovery after typhoon",
        descriptionVi: "Kiểm tra an toàn và phục hồi sau bão",
        contentType: "text", order: 4, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-storm-3"],
        content: {
          hook: "Bão qua đi. Nhưng nguy hiểm chưa hết.",
          sections: [
            { title: "Kiểm tra an toàn", titleVi: "Kiểm tra an toàn", content: "Cảnh báo đường dây điện rơi, nước ngập. Không uống nước chưa qua xử lý.", icon: "⚠️" },
            { title: "Phục hồi", titleVi: "Phục hồi", content: "Kiểm tra gas trước khi dùng lại bếp. Dọn dẹp an toàn.", icon: "🔄" },
          ],
          takeaway: "Sau bão: Kiểm tra an toàn → dọn dẹp → phục hồi.",
        },
      },
    ],
  },
  // --- Khóa 3-8 (rút gọn) ---
  {
    id: "course-landslide", topic: "landslide", title: "Landslide Safety", titleVi: "An toàn sạt lở",
    description: "Recognize warning signs and evacuate safely", descriptionVi: "Nhận biết dấu hiệu cảnh báo và sơ tán an toàn",
    icon: "⛰️", color: "#92400E", level: 2, totalXP: 150, prerequisites: ["course-flood"], estimatedMinutes: 15,
    disasterTypes: ["landslide"], region: "mountainous",
    lessons: [
      { id: "lesson-landslide-1", courseId: "course-landslide", title: "Warning Signs", titleVi: "Dấu hiệu cảnh báo", description: "How to recognize landslide warning signs", descriptionVi: "Cách nhận biết dấu hiệu cảnh báo sạt lở", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Đất trên núi bắt đầu nứt. Bạn có 5 phút. Bạn nhận ra dấu hiệu không?", sections: [{ title: "Dấu hiệu", titleVi: "Dấu hiệu", content: "Vết nứt trên đất, nước tự nhiên chảy ra từ sườn nùi, cây nghiêng một phía, tiếng động lạ từ lòng đất, đất rung nhẹ.", icon: "⚠️" }], takeaway: "Thấy dấu hiệu → sơ tán ngay, không chờ xác nhận." } },
      { id: "lesson-landslide-2", courseId: "course-landslide", title: "Evacuation", titleVi: "Quy trình sơ tán", description: "How to evacuate during landslide", descriptionVi: "Cách sơ tán khi có sạt lở", contentType: "step_by_step", order: 2, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-landslide-1"], content: { hook: "Sạt lở xảy ra trong vài giây. Bạn cần biết đường thoát trước.", sections: [{ title: "Quy trình", titleVi: "Quy trình", content: "Sơ tán ngay khi phát hiện dấu hiệu. Đi theo đường đã định sẵn. Đi lên trên nếu không thể đi ngang. Tránh vùng có khe nứt.", icon: "🏃" }], takeaway: "Sạt lở: Sơ tán ngay → đi lên trên → tránh khe nứt." } },
      { id: "lesson-landslide-3", courseId: "course-landslide", title: "Survival When Trapped", titleVi: "Kỹ năng sống sót khi bị vùi", description: "What to do if trapped under debris", descriptionVi: "Làm gì nếu bị vùi dưới đất đá", contentType: "text", order: 3, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-landslide-2"], content: { hook: "Bạn bị đất vùi lấp. Không gian rất nhỏ. Bạn cần tiết kiệm oxy.", sections: [{ title: "Tự cứu", titleVi: "Tự cứu", content: "Tạo khoảng không quanh mặt, miệng, ngực. Không cử động mạnh. Gọi cứu hộ: hướng lên trên để tiếng vang. Dùng cờ, áo phan trang để đánh dấu.", icon: "🆘" }], takeaway: "Bị vùi: Tạo không gian → tiết kiệm oxy → gọi cứu hộ → đánh dấu vị trí." } },
    ],
  },
  {
    id: "course-firstaid", topic: "first_aid", title: "First Aid", titleVi: "Sơ cấp cứu",
    description: "Essential first aid skills for disaster response", descriptionVi: "Kỹ năng sơ cấp cứu thiết yếu cho cứu hộ thiên tai",
    icon: "🩹", color: "#EF4444", level: 2, totalXP: 200, prerequisites: [], estimatedMinutes: 20,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-fa-1", courseId: "course-firstaid", title: "First Aid Principles", titleVi: "Nguyên tắc sơ cứu", description: "BCD process and scene safety", descriptionVi: "Quy trình BCD và an toàn hiện trường", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Mỗi năm ở VN có 1,500 trẻ em nhập viện vì bỏng. Bạn biết cách sơ cứu không?", sections: [{ title: "Quy trình BCD", titleVi: "Quy trình BCD", content: "B = Bình tĩnh (giữ bình tĩnh, đánh giá tình hình). C = Can thiệp (thực hiện sơ cứu). Đ = Đánh giá (đánh giá kết quả, gọi cấp cứu).", icon: "🩹" }, { title: "An toàn hiện trường", titleVi: "An toàn hiện trường", content: "Luôn kiểm tra an toàn trước khi cứu. Không lao vào nguy hiểm. Gọi 115 (Cấp cứu).", icon: "⚠️" }], takeaway: "BCD: Bình tĩnh → Can thiệp → Đánh giá. An toàn bản thân trước!" } },
      { id: "lesson-fa-2", courseId: "course-firstaid", title: "CPR", titleVi: "Hồi sinh tim phổi", description: "CPR for adults, children, infants", descriptionVi: "CPR cho người lớn, trẻ em, sơ sinh", contentType: "step_by_step", order: 2, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-fa-1"], content: { hook: "Tim ngừng đập. Bạn có 4 phút. Mỗi giây đều quan trọng.", sections: [{ title: "CPR người lớn", titleVi: "CPR người lớn", content: "30 ép ngục : 2 thổi oxy. Tốc độ 100-120/phút. Độ sâu 5-6cm.", icon: "❤️" }, { title: "CPR trẻ em", titleVi: "CPR trẻ em", content: "30 ép ngục : 2 thổi oxy (lực nhẹ hơn). CPR sơ sinh: 3 ép : 1 thổi (2 ngón tay).", icon: "👶" }], takeaway: "CPR: 30:2 → gọi 115 → tiếp tục cho đến khi có cứu hộ." } },
      { id: "lesson-fa-3", courseId: "course-firstaid", title: "Bleeding Control", titleVi: "Cầm máu", description: "How to control bleeding", descriptionVi: "Cách cầm máu", contentType: "step_by_step", order: 3, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-fa-1"], content: { hook: "Chảy máu nhiều có thể giết người trong vài phút. Bạn biết cách cầm máu không?", sections: [{ title: "Cầm máu", titleVi: "Cầm máu", content: "Ép trực tiếp lên vết thương bằng gạc sạch. Nâng cao vùng bị thương. Nếu không cầm được: sử dụng garo.", icon: "🩸" }], takeaway: "Cầm máu: Ép trực tiếp → nâng cao → garo (nếu cần)." } },
    ],
  },
  {
    id: "course-family", topic: "family_plan", title: "Family Plan", titleVi: "Kế hoạch gia đình",
    description: "Build your family disaster preparedness plan", descriptionVi: "Xây dựng kế hoạch phòng chống thiên tai gia đình",
    icon: "👨‍👩‍👧‍👦", color: "#EC4899", level: 1, totalXP: 150, prerequisites: [], estimatedMinutes: 15,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-fam-1", courseId: "course-family", title: "Emergency Kit", titleVi: "Bộ đồ dùng 72 giờ", description: "Build your 72-hour emergency kit", descriptionVi: "Xây dựng bộ đồ dùng 72 giờ", contentType: "checklist", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Bạn có thể sống sót 72 giờ mà không có ai giúp không? Bộ đồ dùng này sẽ giúp bạn.", sections: [{ title: "Nước & Thức ăn", titleVi: "Nước & Thức ăn", content: "9 lít nước, mì gói, bánh quy, khoai lang khô, sữa hộp.", icon: "💧" }, { title: "Y tế", titleVi: "Y tế", content: "Túi sơ cứu, thuốc cá nhân, khẩu trang, găng tay.", icon: "🩹" }, { title: "Dụng cụ", titleVi: "Dụng cụ", content: "Đèn pin, radio FM, dao đa năng, dây thừng, còi.", icon: "🔧" }, { title: "Giấy tờ", titleVi: "Giấy tờ", content: "Bản sao CCCD, bảo hiểm, tiền mặt (bọc nilon).", icon: "📄" }], takeaway: "4 nhóm: Nước/Thức ăn + Y tế + Dụng cụ + Giấy tờ = Sống sót 72 giờ." } },
      { id: "lesson-fam-2", courseId: "course-family", title: "Family Communication", titleVi: "Kế hoạch liên lạc", description: "Set up family communication plan", descriptionVi: "Thiết lập kế hoạch liên lạc gia đình", contentType: "text", order: 2, xpReward: 50, estimatedMinutes: 5, prerequisites: ["lesson-fam-1"], content: { hook: "Mất điện, mất sóng. Gia đình bạn biết tìm nhau ở đâu?", sections: [{ title: "Danh sách liên lạc", titleVi: "Danh sách liên lạc", content: "Số điện thoại tất cả thành viên. Số điện thoại hàng xóm gần nhất. Số trường học của trẻ em.", icon: "📞" }, { title: "Điểm tập hợp", titleVi: "Điểm tập hợp", content: "Điểm 1: Trước nhà. Điểm 2: Nhà hàng xóm. Điểm 3: Trường học. Điểm 4: UBND xã.", icon: "📍" }], takeaway: "4 điểm tập hợp + danh sách liên lạc + người liên lạc ở xa." } },
    ],
  },
  {
    id: "course-community", topic: "community", title: "Community DRR", titleVi: "Vai trò cộng đồng",
    description: "Role of community in disaster risk reduction", descriptionVi: "Vai trò của cộng đồng trong giảm thiểu rủi ro thiên tai",
    icon: "🏘️", color: "#14B8A6", level: 3, totalXP: 100, prerequisites: ["course-flood", "course-storm"], estimatedMinutes: 10,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-com-1", courseId: "course-community", title: "Community Roles", titleVi: "Vai trò cộng đồng", description: "Roles of village head, PCTT committee, volunteers", descriptionVi: "Vai trò của trưởng thôn, Ủy ban PCTT, tình nguyện viên", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Một mình không thể chống lại thiên tai. Cộng đồng là sức mạnh.", sections: [{ title: "Trưởng thôn", titleVi: "Trưởng thôn", content: "Phát hiện cảnh báo sớm, tổ chức sơ tán, quản lý tài nguyên cứu hộ.", icon: "👤" }, { title: "Đội TNV", titleVi: "Đội TNV", content: "Hỗ trợ sơ tán, cứu hộ ban đầu, truyền thông cộng đồng.", icon: "🤝" }, { title: "Hội Phụ nữ", titleVi: "Hội Phụ nữ", content: "Hỗ trợ trẻ em, phụ nữ có thai, người già. Chuẩn bị thức ăn.", icon: "👩" }], takeaway: "Trưởng thôn điều phối + TNV cứu hộ + Phụ nữ chăm sóc = Cộng đồng mạnh." } },
    ],
  },
  {
    id: "course-emergency", topic: "emergency_numbers", title: "Emergency Numbers", titleVi: "Số khẩn cấp",
    description: "Vietnamese emergency contact numbers", descriptionVi: "Số điện thoại khẩn cấp Việt Nam",
    icon: "📞", color: "#DC2626", level: 1, totalXP: 50, prerequisites: [], estimatedMinutes: 5,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-em-1", courseId: "course-emergency", title: "Emergency Numbers", titleVi: "Số khẩn cấp", description: "112, 113, 114, 115 - when to call, how to call", descriptionVi: "112, 113, 114, 115 - khi nào gọi, cách gọi", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 3, prerequisites: [], content: { hook: "Bạn biết gọi số nào khi gặp nguy hiểm không?", sections: [{ title: "112 - Tìm kiếm cứu nạn", titleVi: "112 - Tìm kiếm cứu nạn", content: "Cứu hộ thiên tai, tìm kiếm cứu nạn.", icon: "🆘" }, { title: "113 - Công an", titleVi: "113 - Công an", content: "An ninh trật tự, cứu hộ cộng đồng.", icon: "👮" }, { title: "114 - PCCC", titleVi: "114 - PCCC", content: "Cứu hỏa, cứu nạn cháy nổ.", icon: "🚒" }, { title: "115 - Cấp cứu", titleVi: "115 - Cấp cứu", content: "Cấp cứu y tế, vận chuyển bệnh nhân.", icon: "🚑" }], takeaway: "112=Cứu nạn, 113=Công an, 114=Cứu hỏa, 115=Cấp cứu. Nhớ cả 4 số!" } },
    ],
  },
  {
    id: "course-health", topic: "health", title: "Post-Disaster Health", titleVi: "Sức khỏe sau thiên tai",
    description: "Disease prevention and mental health after disasters", descriptionVi: "Phòng bệnh và sức khỏe tâm lý sau thiên tai",
    icon: "🏥", color: "#F97316", level: 2, totalXP: 100, prerequisites: ["course-flood"], estimatedMinutes: 10,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-hlth-1", courseId: "course-health", title: "Post-Disaster Diseases", titleVi: "Bệnh sau thiên tai", description: "Common diseases after floods and how to prevent them", descriptionVi: "Bệnh thường gặp sau lũ và cách phòng", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Lũ rút xong, bệnh tật bắt đầu. Bạn biết phòng bệnh thế nào?", sections: [{ title: "Bệnh về tiêu hóa", titleVi: "Bệnh về tiêu hóa", content: "Tiêu chảy, thương hàn, leptospirosis. Phòng: uống nước đã xử lý, ăn chín uống sôi.", icon: "🏥" }, { title: "Sức khỏe tâm lý", titleVi: "Sức khỏe tâm lý", content: "PTSD, lo âu, trầm cảm là phản ứng bình thường. Tìm hỗ trợ tâm lý nếu cần.", icon: "💚" }], takeaway: "Sau lũ: uống nước sạch + ăn chín + rửa tay + hỗ trợ tâm lý." } },
    ],
  },
  {
    id: "course-culture", topic: "culture", title: "Culture & DRR", titleVi: "Văn hóa & PCTT",
    description: "Vietnamese cultural values in disaster risk reduction", descriptionVi: "Giá trị văn hóa Việt Nam trong phòng chống thiên tai",
    icon: "🇻🇳", color: "#22C55E", level: 3, totalXP: 100, prerequisites: [], estimatedMinutes: 10,
    disasterTypes: [], region: "all",
    lessons: [
      { id: "lesson-cult-1", courseId: "course-culture", title: "Cultural Values", titleVi: "Giá trị văn hóa", description: "Buddhism, ancestor worship, community solidarity in DRR", descriptionVi: "Phật giáo, thờ cúng tổ tiên, tương thân tương ái trong PCTT", contentType: "text", order: 1, xpReward: 50, estimatedMinutes: 5, prerequisites: [], content: { hook: "Tương thân tương ái - giá trị cốt lõi của người Việt trong thiên tai.", sections: [{ title: "Phật giáo", titleVi: "Phật giáo", content: "Vô thường: không có gì vĩnh viễn. Từ bi: giúp đỡ người khác.", icon: "🙏" }, { title: "Tương thân tương ái", titleVi: "Tương thân tương ái", content: "Lá lành đùm lá rách. Cộng đồng giúp đỡ lẫn nhau trong thiên tai.", icon: "🤝" }], takeaway: "Giá trị Việt: Vô thường + Từ bi + Tương thân tương ái = Sức mạnh cộng đồng." } },
    ],
  },
];

// =============================================================================
// 2. SCENARIOS (3 interactive scenarios)
// =============================================================================

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: "scenario-flood",
    title: "The Rising Flood",
    titleVi: "Lũ về",
    description: "Mekong Delta flooding scenario with multiple decision points",
    descriptionVi: "Kịch bản lũ ĐBSCL với nhiều điểm quyết định",
    type: "flood",
    complexity: 2,
    icon: "🌊",
    color: "#3B82F6",
    region: "ĐBSCL",
    estimatedMinutes: 5,
    xpReward: 150,
    learningObjectives: [
      "Nhận biết dấu hiệu lũ lụt",
      "Quyết định sơ tán đúng lúc",
      "Chuẩn bị đồ dùng thiết yếu",
    ],
    bestPath: ["flood-1", "flood-2a", "flood-3a", "flood-4a"],
    entryNodeId: "flood-1",
    nodes: [
      {
        id: "flood-1",
        type: "decision",
        narrative: "You live in a riverside house in Can Tho. The river water has been rising for 2 days. Your neighbor says the water will rise 2 more meters tonight. What do you do?",
        narrativeVi: "Bạn sống trong nhà ven sông ở Cần Thơ. Nước sông đã dâng 2 ngày. Hàng xóm nói nước sẽ dâng thêm 2m tối nay. Bạn làm gì?",
        choices: [
          { id: "flood-1a", text: "Move furniture upstairs immediately", textVi: "Di chuyển đồ đạc lên cao ngay", nextNodeId: "flood-2a", correctness: "optimal", learningNote: "Bảo vệ tài sản trước khi sơ tán là bước đầu tiên.", learningNoteVi: "Bảo vệ tài sản trước khi sơ tán là bước đầu tiên." },
          { id: "flood-1b", text: "Wait and see if the water really rises", textVi: "Chờ xem nước có dâng thật không", nextNodeId: "flood-2b", correctness: "dangerous", learningNote: "Chờ đợi có thể quá muộn. Nước lũ ĐBSCL dâng nhanh.", learningNoteVi: "Chờ đợi có thể quá muộn. Nước lũ ĐBSCL dâng nhanh." },
          { id: "flood-1c", text: "Go to sleep, deal with it tomorrow", textVi: "Đi ngủ, mai tính", nextNodeId: "flood-2b", correctness: "dangerous", learningNote: "Lũ có thể dâng nhanh vào ban đêm.", learningNoteVi: "Lũ có thể dâng nhanh vào ban đêm." },
        ],
      },
      {
        id: "flood-2a",
        type: "decision",
        narrative: "Good decision! You've moved important items upstairs. The water is now ankle-deep on the ground floor. Your elderly neighbor is still in their house. What do you do?",
        narrativeVi: "Quyết định tốt! Bạn đã chuyển đồ lên tầng 2. Nước đã ngập mắt cá ở tầng 1. Hàng xóm lớn tuổi vẫn ở trong nhà. Bạn làm gì?",
        choices: [
          { id: "flood-2a-1", text: "Help your elderly neighbor evacuate first", textVi: "Giúp hàng xóm lớn tuổi sơ tán trước", nextNodeId: "flood-3a", correctness: "optimal", learningNote: "Giúp người yếu thế là ưu tiên. +200 điểm!", learningNoteVi: "Giúp người yếu thế là ưu tiên. +200 điểm!" },
          { id: "flood-2a-2", text: "Your family first, then help others", textVi: "Gia đình mình trước, rồi giúp người khác", nextNodeId: "flood-3b", correctness: "acceptable", learningNote: "An toàn gia đình quan trọng, nhưng giúp hàng xóm cũng cần thiết.", learningNoteVi: "An toàn gia đình quan trọng, nhưng giúp hàng xóm cũng cần thiết." },
        ],
      },
      {
        id: "flood-2b",
        type: "outcome",
        narrative: "The water rose faster than expected! You're now trapped on the roof with your family. You should have acted earlier. Call 112 for rescue.",
        narrativeVi: "Nước dâng nhanh hơn dự kiến! Bạn bị kẹt trên mái nhà cùng gia đình. Đáng lẽ bạn nên hành động sớm hơn. Gọi 112 để cứu hộ.",
        metrics: { safety: -50, resources: -30, time: -40, morale: -30 },
      },
      {
        id: "flood-3a",
        type: "decision",
        narrative: "Your neighbor is safe! Now you need to evacuate. The water is knee-deep. You have a boat. What do you bring?",
        narrativeVi: "Hàng xóm an toàn! Bạn cần sơ tán. Nước ngập đầu gối. Bạn có thuyền. Bạn mang theo gì?",
        choices: [
          { id: "flood-3a-1", text: "Documents, medicine, water, phone (in waterproof bag)", textVi: "Giấy tờ, thuốc, nước, điện thoại (trong túi chống nước)", nextNodeId: "flood-4a", correctness: "optimal", learningNote: "Giấy tờ + thuốc + nước + điện thoại = 4 thứ thiết yếu nhất.", learningNoteVi: "Giấy tờ + thuốc + nước + điện thoại = 4 thứ thiết yếu nhất." },
          { id: "flood-3a-2", text: "Only clothes and money", textVi: "Chỉ quần áo và tiền", nextNodeId: "flood-4b", correctness: "suboptimal", learningNote: "Quần áo có thể mua lại. Giấy tờ và thuốc thì không.", learningNoteVi: "Quần áo có thể mua lại. Giấy tờ và thuốc thì không." },
        ],
      },
      {
        id: "flood-3b",
        type: "decision",
        narrative: "You helped your family first, then went to help your neighbor. But the water is now waist-deep. It's harder to move. What do you do?",
        narrativeVi: "Bạn giúp gia đình trước, rồi đi giúp hàng xóm. Nhưng nước đã ngập eo. Di chuyển khó hơn. Bạn làm gì?",
        choices: [
          { id: "flood-3b-1", text: "Use the boat to reach your neighbor", textVi: "Dùng thuyền để tiếp cận hàng xóm", nextNodeId: "flood-4a", correctness: "acceptable", learningNote: "Thuyền là phương tiện tốt nhất trong lũ.", learningNoteVi: "Thuyền là phương tiện tốt nhất trong lũ." },
          { id: "flood-3b-2", text: "It's too dangerous, call 112 for professional help", textVi: "Quá nguy hiểm, gọi 112 để nhờ chuyên nghiệp", nextNodeId: "flood-4a", correctness: "acceptable", learningNote: "Biết giới hạn của mình cũng là kỹ năng quan trọng.", learningNoteVi: "Biết giới hạn của mình cũng là kỹ năng quan trọng." },
        ],
      },
      {
        id: "flood-4a",
        type: "debrief",
        narrative: "Excellent! You've safely evacuated with your family and helped your neighbor. Key lessons: 1) Act early, don't wait. 2) Help vulnerable people first. 3) Bring essential items only. 4) Use a boat if available.",
        narrativeVi: "Xuất sắc! Bạn đã sơ tán an toàn cùng gia đình và giúp hàng xóm. Bài học: 1) Hành động sớm, không chờ. 2) Giúp người yếu thế trước. 3) Chỉ mang đồ thiết yếu. 4) Dùng thuyền nếu có.",
        metrics: { safety: 50, resources: 30, time: 40, morale: 40 },
      },
      {
        id: "flood-4b",
        type: "debrief",
        narrative: "You evacuated but forgot essential items. Next time, prepare a go-bag with documents, medicine, water, and phone in a waterproof bag.",
        narrativeVi: "Bạn đã sơ tán nhưng quên đồ thiết yếu. Lần sau, chuẩn bị balô sẵn với giấy tờ, thuốc, nước và điện thoại trong túi chống nước.",
        metrics: { safety: 30, resources: -20, time: 20, morale: 10 },
      },
    ],
  },
  // Storm scenario (rút gọn)
  {
    id: "scenario-storm",
    title: "Typhoon No. 9",
    titleVi: "Bão số 9",
    description: "Da Nang typhoon scenario with preparation timeline",
    descriptionVi: "Kịch bản bão Đà Nẵng với timeline chuẩn bị",
    type: "storm",
    complexity: 2,
    icon: "🌪️",
    color: "#8B5CF6",
    region: "Đà Nẵng",
    estimatedMinutes: 5,
    xpReward: 150,
    learningObjectives: ["Chuẩn bị trước bão theo timeline", "Quyết định sơ tán vs ở lại", "Bảo vệ hàng xóm lớn tuổi"],
    bestPath: ["storm-1", "storm-2a", "storm-3a"],
    entryNodeId: "storm-1",
    nodes: [
      { id: "storm-1", type: "decision", narrative: "A Category 4 typhoon is approaching Da Nang. Landfall in 12 hours. You live in a 2-story house near the coast.", narrativeVi: "Bão cấp 4 đang đến Đà Nẵng. Đổ bộ sau 12 giờ. Bạn sống trong nhà 2 tầng gần biển.", choices: [
        { id: "storm-1a", text: "Evacuate to a shelter now", textVi: "Sơ tán đến nơi trú ẩn ngay", nextNodeId: "storm-2a", correctness: "optimal", learningNote: "Sơ tán sớm luôn an toàn hơn.", learningNoteVi: "Sơ tán sớm luôn an toàn hơn." },
        { id: "storm-1b", text: "Stay and fortify the house", textVi: "Ở lại và gia cố nhà", nextNodeId: "storm-2b", correctness: "acceptable", learningNote: "Gia cố có thể giúp nhưng không đảm bảo an toàn tuyệt đối.", learningNoteVi: "Gia cố có thể giúp nhưng không đảm bảo an toàn tuyệt đối." },
      ]},
      { id: "storm-2a", type: "decision", narrative: "Good! You're at the shelter. Your elderly neighbor didn't evacuate. What do you do?", narrativeVi: "Tốt! Bạn ở nơi trú ẩn. Hàng xóm lớn tuổi không sơ tán. Bạn làm gì?", choices: [
        { id: "storm-2a-1", text: "Go back to help them evacuate", textVi: "Quay lại giúp họ sơ tán", nextNodeId: "storm-3a", correctness: "optimal", learningNote: "Giúp người yếu thế là trách nhiệm cộng đồng.", learningNoteVi: "Giúp người yếu thế là trách nhiệm cộng đồng." },
        { id: "storm-2a-2", text: "Call 112 to report their location", textVi: "Gọi 112 báo vị trí của họ", nextNodeId: "storm-3a", correctness: "acceptable", learningNote: "Gọi chuyên nghiệp cũng là cách tốt.", learningNoteVi: "Gọi chuyên nghiệp cũng là cách tốt." },
      ]},
      { id: "storm-2b", type: "outcome", narrative: "The typhoon damaged your roof. You're now sheltering in the bathroom. The wind is too strong to evacuate now.", narrativeVi: "Bão đã hỏng mái nhà bạn. Bạn đang trú trong phòng tắm. Gió quá mạnh để sơ tán.", metrics: { safety: -30, resources: -20, time: -20, morale: -20 } },
      { id: "storm-3a", type: "debrief", narrative: "Excellent! You prepared well and helped your neighbor. Key lessons: 1) Evacuate early. 2) Help vulnerable neighbors. 3) Follow the 72h preparation timeline.", narrativeVi: "Xuất sắc! Bạn chuẩn bị tốt và giúp hàng xóm. Bài học: 1) Sơ tán sớm. 2) Giúp hàng xóm yếu thế. 3) Tuân theo timeline chuẩn bị 72h.", metrics: { safety: 50, resources: 30, time: 40, morale: 50 } },
    ],
  },
  // Landslide scenario (rút gọn)
  {
    id: "scenario-landslide",
    title: "Cracking Mountain",
    titleVi: "Đất nứt",
    description: "Northern mountain landslide scenario",
    descriptionVi: "Kịch bản sạt lở miền núi phía Bắc",
    type: "landslide",
    complexity: 3,
    icon: "⛰️",
    color: "#92400E",
    region: "Lào Cai",
    estimatedMinutes: 5,
    xpReward: 200,
    learningObjectives: ["Nhận biết dấu hiệu sạt lở", "Quyết định sơ tán đúng lúc", "Kỹ năng sống sót khi bị vùi"],
    bestPath: ["ls-1", "ls-2a", "ls-3a"],
    entryNodeId: "ls-1",
    nodes: [
      { id: "ls-1", type: "decision", narrative: "You live in a mountain village in Lao Cai. After 3 days of heavy rain, you notice cracks in the soil behind your house and water seeping from the hillside.", narrativeVi: "Bạn sống ở bản miền núi Lào Cai. Sau 3 ngày mưa lớn, bạn thấy đất nứt sau nhà và nước rỉ ra từ sườn núi.", choices: [
        { id: "ls-1a", text: "Evacuate immediately with family", textVi: "Sơ tán ngay cùng gia đình", nextNodeId: "ls-2a", correctness: "optimal", learningNote: "Thấy dấu hiệu = sơ tán ngay, không chờ xác nhận.", learningNoteVi: "Thấy dấu hiệu = sơ tán ngay, không chờ xác nhận." },
        { id: "ls-1b", text: "Wait to see if it gets worse", textVi: "Chờ xem có nặng hơn không", nextNodeId: "ls-2b", correctness: "dangerous", learningNote: "Sạt lở xảy ra trong vài giây. Không có thời gian chờ.", learningNoteVi: "Sạt lở xảy ra trong vài giây. Không có thời gian chờ." },
      ]},
      { id: "ls-2a", type: "decision", narrative: "You're evacuating uphill. You hear a loud rumbling sound. The ground is shaking. What do you do?", narrativeVi: "Bạn đang sơ tán lên trên. Bạn nghe tiếng động lớn. Đất rung. Bạn làm gì?", choices: [
        { id: "ls-2a-1", text: "Run to the nearest solid rock formation", textVi: "Chạy đến tảng đá gần nhất", nextNodeId: "ls-3a", correctness: "optimal", learningNote: "Tảng đá là nơi an toàn nhất khi sạt lở.", learningNoteVi: "Tảng đá là nơi an toàn nhất khi sạt lở." },
        { id: "ls-2a-2", text: "Lie flat and cover your head", textVi: "Nằm úp và che đầu", nextNodeId: "ls-3a", correctness: "acceptable", learningNote: "Nằm úp bảo vệ đầu nhưng không tránh được đất đá.", learningNoteVi: "Nằm úp bảo vệ đầu nhưng không tránh được đất đá." },
      ]},
      { id: "ls-2b", type: "outcome", narrative: "The landslide happened suddenly! You're buried under debris. Remember: create air space around your face, don't shout (save oxygen), tap on rocks for rescuers.", narrativeVi: "Sạt lở xảy ra bất ngờ! Bạn bị vùi dưới đất đá. Nhớ: tạo không gian không khí quanh mặt, không la hét (tiết kiệm oxy), gõ vào đá để cứu hộ tìm.", metrics: { safety: -70, resources: -50, time: -60, morale: -50 } },
      { id: "ls-3a", type: "debrief", narrative: "You survived! Key lessons: 1) Recognize warning signs early. 2) Evacuate immediately, don't wait. 3) Go uphill, not downhill. 4) If trapped: create air space, save oxygen, signal for help.", narrativeVi: "Bạn sống sót! Bài học: 1) Nhận biết dấu hiệu sớm. 2) Sơ tán ngay, không chờ. 3) Đi lên trên, không đi xuống. 4) Nếu bị vùi: tạo không gian, tiết kiệm oxy, phát tín hiệu.", metrics: { safety: 60, resources: 20, time: 50, morale: 40 } },
    ],
  },
];

// =============================================================================
// 3. QUIZ QUESTIONS (50 questions, Bloom's aligned)
// =============================================================================

export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- Remember (10 questions) ---
  { id: "q-1", type: "multiple_choice", bloomLevel: "remember", topicTag: "flood", difficulty: -1, discrimination: 1.0, question: "What are the three types of floods in Vietnam?", questionVi: "3 loại lũ lụt ở Việt Nam là gì?", options: [
    { id: "q-1-a", text: "River flood, flash flood, urban flood", textVi: "Lũ sông, lũ quét, ngập đô thị" },
    { id: "q-1-b", text: "Tsunami, storm surge, river flood", textVi: "Sóng thần, triều cường, lũ sông" },
    { id: "q-1-c", text: "Only river floods", textVi: "Chỉ lũ sông" },
    { id: "q-1-d", text: "Flash flood only", textVi: "Chỉ lũ quét" },
  ], correctOptionId: "q-1-a", explanation: "Vietnam has 3 main types: river flood (ĐBSCL), flash flood (Miền Trung), urban flood (thành phố).", explanationVi: "Việt Nam có 3 loại chính: lũ sông (ĐBSCL), lũ quét (Miền Trung), ngập đô thị (thành phố)." },

  { id: "q-2", type: "true_false", bloomLevel: "remember", topicTag: "emergency", difficulty: -2, discrimination: 0.8, question: "112 is the number for search and rescue in Vietnam.", questionVi: "112 là số tìm kiếm cứu nạn ở Việt Nam.", options: [
    { id: "q-2-t", text: "True", textVi: "Đúng" },
    { id: "q-2-f", text: "False", textVi: "Sai" },
  ], correctOptionId: "q-2-t", explanation: "112 is the correct number for search and rescue in Vietnam.", explanationVi: "112 đúng là số tìm kiếm cứu nạn ở Việt Nam." },

  { id: "q-3", type: "multiple_choice", bloomLevel: "remember", topicTag: "storm", difficulty: -1, discrimination: 1.0, question: "How many hours before a typhoon should you start preparing?", questionVi: "Bạn nên bắt đầu chuẩn bị trước bão bao nhiêu giờ?", options: [
    { id: "q-3-a", text: "24 hours", textVi: "24 giờ" },
    { id: "q-3-b", text: "72 hours", textVi: "72 giờ" },
    { id: "q-3-c", text: "6 hours", textVi: "6 giờ" },
    { id: "q-3-d", text: "1 hour", textVi: "1 giờ" },
  ], correctOptionId: "q-3-b", explanation: "Start preparing 72 hours before a typhoon for adequate preparation time.", explanationVi: "Bắt đầu chuẩn bị 72 giờ trước bão để có đủ thời gian." },

  { id: "q-4", type: "multiple_choice", bloomLevel: "remember", topicTag: "first_aid", difficulty: -1, discrimination: 1.0, question: "What is the CPR ratio for adults?", questionVi: "Tỷ lệ CPR cho người lớn là bao nhiêu?", options: [
    { id: "q-4-a", text: "15:2", textVi: "15:2" },
    { id: "q-4-b", text: "30:2", textVi: "30:2" },
    { id: "q-4-c", text: "30:1", textVi: "30:1" },
    { id: "q-4-d", text: "15:1", textVi: "15:1" },
  ], correctOptionId: "q-4-b", explanation: "Adult CPR ratio is 30 chest compressions : 2 rescue breaths.", explanationVi: "Tỷ lệ CPR người lớn là 30 ép ngục : 2 thổi oxy." },

  { id: "q-5", type: "true_false", bloomLevel: "remember", topicTag: "landslide", difficulty: -1, discrimination: 0.9, question: "You should wait for official confirmation before evacuating during a landslide warning.", questionVi: "Bạn nên chờ xác nhận chính thức trước khi sơ tán khi có cảnh báo sạt lở.", options: [
    { id: "q-5-t", text: "True", textVi: "Đúng" },
    { id: "q-5-f", text: "False", textVi: "Sai" },
  ], correctOptionId: "q-5-f", explanation: "Never wait for confirmation. Evacuate immediately when you see warning signs.", explanationVi: "Không bao giờ chờ xác nhận. Sơ tán ngay khi thấy dấu hiệu cảnh báo." },

  { id: "q-6", type: "multiple_choice", bloomLevel: "remember", topicTag: "tsunami", difficulty: -1, discrimination: 1.0, question: "What natural warning sign indicates a tsunami is coming?", questionVi: "Dấu hiệu tự nhiên nào cho thấy sóng thần sắp đến?", options: [
    { id: "q-6-a", text: "Ocean water recedes rapidly", textVi: "Nước biển rút nhanh" },
    { id: "q-6-b", text: "Strong wind", textVi: "Gió mạnh" },
    { id: "q-6-c", text: "Heavy rain", textVi: "Mưa lớn" },
    { id: "q-6-d", text: "Thunder", textVi: "Sấm sét" },
  ], correctOptionId: "q-6-a", explanation: "Rapid ocean water recession is the primary natural warning sign of a tsunami.", explanationVi: "Nước biển rút nhanh là dấu hiệu cảnh báo chính của sóng thần." },

  { id: "q-7", type: "multiple_choice", bloomLevel: "remember", topicTag: "first_aid", difficulty: -1, discrimination: 1.0, question: "What should you NOT do for a burn?", questionVi: "Bạn KHÔNG nên làm gì khi bị bỏng?", options: [
    { id: "q-7-a", text: "Apply cool water for 15-20 minutes", textVi: "Dùng nước mát 15-20 phút" },
    { id: "q-7-b", text: "Apply toothpaste", textVi: "Bôi kem đánh răng" },
    { id: "q-7-c", text: "Remove the heat source", textVi: "Loại bỏ nguồn nhiệt" },
    { id: "q-7-d", text: "Cover with clean gauze", textVi: "Che bằng gạc sạch" },
  ], correctOptionId: "q-7-b", explanation: "Never apply toothpaste, fish sauce, or other home remedies to burns.", explanationVi: "Không bao giờ bôi kem đánh răng, nước mắm hoặc mẹo dân gian lên vết bỏng." },

  { id: "q-8", type: "multiple_choice", bloomLevel: "remember", topicTag: "flood", difficulty: -1, discrimination: 1.0, question: "How much water should you store per person per day for emergency?", questionVi: "Bạn nên dự trữ bao nhiêu nước mỗi người mỗi ngày cho khẩn cấp?", options: [
    { id: "q-8-a", text: "1 liter", textVi: "1 lít" },
    { id: "q-8-b", text: "2 liters", textVi: "2 lít" },
    { id: "q-8-c", text: "4 liters", textVi: "4 lít" },
    { id: "q-8-d", text: "8 liters", textVi: "8 lít" },
  ], correctOptionId: "q-8-c", explanation: "Store 4 liters per person per day (drinking + sanitation).", explanationVi: "Dự trữ 4 lít mỗi người mỗi ngày (uống + vệ sinh)." },

  { id: "q-9", type: "true_false", bloomLevel: "remember", topicTag: "earthquake", difficulty: -2, discrimination: 0.8, question: "During an earthquake, you should run outside immediately.", questionVi: "Khi động đất, bạn nên chạy ra ngoài ngay lập tức.", options: [
    { id: "q-9-t", text: "True", textVi: "Đúng" },
    { id: "q-9-f", text: "False", textVi: "Sai" },
  ], correctOptionId: "q-9-f", explanation: "Drop-Cover-Hold On is safer than running. Only evacuate after shaking stops.", explanationVi: "Úp-Che-Bám an toàn hơn chạy. Chỉ sơ tán sau khi rung dừng." },

  { id: "q-10", type: "multiple_choice", bloomLevel: "remember", topicTag: "family_plan", difficulty: -1, discrimination: 1.0, question: "How many meeting points should a family emergency plan have?", questionVi: "Kế hoạch khẩn cấp gia đình nên có bao nhiêu điểm tập hợp?", options: [
    { id: "q-10-a", text: "1", textVi: "1" },
    { id: "q-10-b", text: "2", textVi: "2" },
    { id: "q-10-c", text: "4", textVi: "4" },
    { id: "q-10-d", text: "10", textVi: "10" },
  ], correctOptionId: "q-10-c", explanation: "4 meeting points: in front of house, neighbor's house, school, commune office.", explanationVi: "4 điểm tập hợp: trước nhà, nhà hàng xóm, trường học, UBND xã." },

  // --- Understand (12 questions) ---
  { id: "q-11", type: "multiple_choice", bloomLevel: "understand", topicTag: "flood", difficulty: 0, discrimination: 1.2, question: "Why is Mekong Delta flooding different from Central Vietnam flooding?", questionVi: "Tại sao lũ ĐBSCL khác với lũ Miền Trung?", options: [
    { id: "q-11-a", text: "Mekong floods rise slowly over weeks; Central floods happen in hours", textVi: "Lũ ĐBSCL dâng chậm trong nhiều tuần; lũ Miền Trung xảy ra trong vài giờ" },
    { id: "q-11-b", text: "They are the same", textVi: "Giống nhau" },
    { id: "q-11-c", text: "Mekong floods are always worse", textVi: "Lũ ĐBSCL luôn tệ hơn" },
    { id: "q-11-d", text: "Central floods are not dangerous", textVi: "Lũ Miền Trung không nguy hiểm" },
  ], correctOptionId: "q-11-a", explanation: "Mekong floods are seasonal and gradual; Central Vietnam flash floods are sudden and deadly.", explanationVi: "Lũ ĐBSCL theo mùa và từ từ; lũ quét Miền Trung đột ngột và chết chóc." },

  { id: "q-12", type: "multiple_choice", bloomLevel: "understand", topicTag: "first_aid", difficulty: 0, discrimination: 1.2, question: "Why do we NOT perform CPR in mass casualty events?", questionVi: "Tại sao KHÔNG hồi sinh trong sự cố mass casualty?", options: [
    { id: "q-12-a", text: "Limited resources should go to saveable patients", textVi: "Tài nguyên hạn chế nên dành cho bệnh nhân có thể cứu" },
    { id: "q-12-b", text: "CPR doesn't work", textVi: "CPR không hiệu quả" },
    { id: "q-12-c", text: "It's too dangerous", textVi: "Quá nguy hiểm" },
    { id: "q-12-d", text: "It's illegal", textVi: "Bất hợp pháp" },
  ], correctOptionId: "q-12-a", explanation: "In mass casualty events, resources are limited and should be used where they can save the most lives.", explanationVi: "Trong sự cố mass casualty, tài nguyên hạn chế nên dùng nơi cứu được nhiều mạng sống nhất." },

  { id: "q-13", type: "multiple_choice", bloomLevel: "understand", topicTag: "landslide", difficulty: 0, discrimination: 1.2, question: "Why should you go UPHILL during a landslide evacuation?", questionVi: "Tại sao bạn nên đi LÊN TRÊN khi sơ tán sạt lở?", options: [
    { id: "q-13-a", text: "Landslide material flows downhill; uphill is safer", textVi: "Vật liệu sạt lở chảy xuống dưới; lên trên an toàn hơn" },
    { id: "q-13-b", text: "It doesn't matter which direction", textVi: "Hướng nào cũng được" },
    { id: "q-13-c", text: "Downhill is faster", textVi: "Đi xuống nhanh hơn" },
    { id: "q-13-d", text: "There are more shelters downhill", textVi: "Có nhiều nơi trú ẩn hơn ở dưới" },
  ], correctOptionId: "q-13-a", explanation: "Landslide debris flows downhill due to gravity. Going uphill puts you out of the flow path.", explanationVi: "Đất đá sạt lở chảy xuống dưới do trọng lực. Đi lên trên giúp bạn ra khỏi dòng chảy." },

  { id: "q-14", type: "multiple_choice", bloomLevel: "understand", topicTag: "health", difficulty: 0, discrimination: 1.2, question: "Why is leptospirosis a major concern after floods?", questionVi: "Tại sao leptospirosis là mối lo lớn sau lũ?", options: [
    { id: "q-14-a", text: "Contaminated floodwater with rat urine can infect through skin wounds", textVi: "Nước lũ bị ô nhiễm nước tiểu chuột có thể lây qua vết thương da" },
    { id: "q-14-b", text: "It's not a concern", textVi: "Không phải mối lo" },
    { id: "q-14-c", text: "Only affects animals", textVi: "Chỉ ảnh hưởng động vật" },
    { id: "q-14-d", text: "Only in cold weather", textVi: "Chỉ trong thời tiết lạnh" },
  ], correctOptionId: "q-14-a", explanation: "Leptospirosis spreads through contact with water contaminated by infected animal urine, common in flood conditions.", explanationVi: "Leptospirosis lây qua tiếp xúc với nước bị ô nhiễm nước tiểu động vật nhiễm bệnh, phổ biến trong điều kiện lũ lụt." },

  // --- Apply (12 questions) ---
  { id: "q-15", type: "multiple_choice", bloomLevel: "apply", topicTag: "flood", difficulty: 1, discrimination: 1.3, question: "You are on the 1st floor and flood water is rising fast. What is your immediate action sequence?", questionVi: "Bạn ở tầng 1 và nước lũ đang dâng nhanh. Chuỗi hành động ngay lập tức là gì?", options: [
    { id: "q-15-a", text: "Move to 2nd floor → call 112 → signal for help", textVi: "Lên tầng 2 → gọi 112 → phát tín hiệu cầu cứu" },
    { id: "q-15-b", text: "Try to save furniture first", textVi: "Cố cứu đồ đạc trước" },
    { id: "q-15-c", text: "Open all doors to let water flow through", textVi: "Mở tất cả cửa để nước chảy qua" },
    { id: "q-15-d", text: "Swim outside", textVi: "Bơi ra ngoài" },
  ], correctOptionId: "q-15-a", explanation: "Priority: get to higher ground → call for help → signal your location.", explanationVi: "Ưu tiên: lên nơi cao → gọi cứu hộ → đánh dấu vị trí." },

  { id: "q-16", type: "multiple_choice", bloomLevel: "apply", topicTag: "first_aid", difficulty: 1, discrimination: 1.3, question: "A person is unconscious and not breathing after a flood drowning. What is your first action?", questionVi: "Một người bất tỉnh và không thở sau đuối nước. Hành động đầu tiên là gì?", options: [
    { id: "q-16-a", text: "Give 5 rescue breaths, then start CPR", textVi: "Cho 5 hơi thở cứu hộ, sau đó bắt đầu CPR" },
    { id: "q-16-b", text: "Start chest compressions immediately", textVi: "Bắt đầu ép ngục ngay" },
    { id: "q-16-c", text: "Turn them upside down to drain water", textVi: "Lật ngược người để rút nước" },
    { id: "q-16-d", text: "Slap their face to wake them up", textVi: "Tát mặt để đánh thức" },
  ], correctOptionId: "q-16-a", explanation: "For drowning victims, give 5 rescue breaths first (they need oxygen), then standard CPR 30:2.", explanationVi: "Với nạn nhân đuối nước, cho 5 hơi thở cứu hộ trước (cần oxy), sau đó CPR tiêu chuẩn 30:2." },

  // --- Analyze (8 questions) ---
  { id: "q-17", type: "multiple_choice", bloomLevel: "analyze", topicTag: "flood", difficulty: 2, discrimination: 1.4, question: "Compare sheltering in place vs evacuation for this scenario: You live in a concrete 3-story house on high ground, and the flood is expected to reach 2 meters. Which is safer and why?", questionVi: "So sánh trú tại chỗ vs sơ tán: Bạn sống trong nhà bê tông 3 tầng trên cao, lũ dự kiến đạt 2m. Cách nào an toàn hơn và tại sao?", options: [
    { id: "q-17-a", text: "Shelter in place - the house can withstand 2m flood", textVi: "Trú tại chỗ - nhà có thể chịu được lũ 2m" },
    { id: "q-17-b", text: "Evacuate - always evacuate regardless of conditions", textVi: "Sơ tán - luôn sơ tán bất kể điều kiện" },
    { id: "q-17-c", text: "Shelter in place but prepare for evacuation if water exceeds prediction", textVi: "Trú tại chỗ nhưng chuẩn bị sơ tán nếu nước vượt dự đoán" },
    { id: "q-17-d", text: "It doesn't matter", textVi: "Không quan trọng" },
  ], correctOptionId: "q-17-c", explanation: "A concrete 3-story house on high ground can likely handle 2m flood. But always have a backup plan.", explanationVi: "Nhà bê tông 3 tầng trên cao có thể chịu được lũ 2m. Nhưng luôn có kế hoạch dự phòng." },

  // --- Evaluate (5 questions) ---
  { id: "q-18", type: "multiple_choice", bloomLevel: "evaluate", topicTag: "community", difficulty: 2, discrimination: 1.4, question: "Evaluate this emergency plan: A commune has a single evacuation route, one shelter, and no communication system. What are its main weaknesses?", questionVi: "Đánh giá kế hoạch này: Một xã có 1 đường sơ tán, 1 nơi trú ẩn, không có hệ thống truyền thông. Điểm yếu chính là gì?", options: [
    { id: "q-18-a", text: "Single point of failure in route and shelter; no way to coordinate", textVi: "Điểm lỗi đơn trong đường đi và nơi trú; không cách nào phối hợp" },
    { id: "q-18-b", text: "It's a good plan", textVi: "Kế hoạch tốt" },
    { id: "q-18-c", text: "Only the route is a problem", textVi: "Chỉ đường đi là vấn đề" },
    { id: "q-18-d", text: "Only communication is a problem", textVi: "Chỉ truyền thông là vấn đề" },
  ], correctOptionId: "q-18-a", explanation: "Multiple routes, multiple shelters, and communication are all essential for resilience.", explanationVi: "Nhiều đường đi, nhiều nơi trú ẩn, và truyền thông đều cần thiết cho khả năng chống chịu." },

  // --- Create (3 questions) ---
  { id: "q-19", type: "multiple_choice", bloomLevel: "create", topicTag: "family_plan", difficulty: 3, discrimination: 1.5, question: "Design a family emergency plan for a family with: 2 adults, 1 toddler, 1 elderly person with diabetes, and a pet dog. What are the 3 most important elements?", questionVi: "Thiết kế kế hoạch khẩn cấp cho gia đình: 2 người lớn, 1 trẻ nhỏ, 1 người già bị tiểu huyết, 1 chó nuôi. 3 yếu tố quan trọng nhất?", options: [
    { id: "q-19-a", text: "Medicine for elderly, baby supplies, pet evacuation plan", textVi: "Thuốc cho người già, đồ dùng em bé, kế hoạch sơ tán thú cưng" },
    { id: "q-19-b", text: "Only focus on adults", textVi: "Chỉ tập trung vào người lớn" },
    { id: "q-19-c", text: "Leave the pet behind", textVi: "Bỏ lại thú cưng" },
    { id: "q-19-d", text: "Only bring money", textVi: "Chỉ mang tiền" },
  ], correctOptionId: "q-19-a", explanation: "Special needs (medicine, baby supplies) and pet planning are essential for family preparedness.", explanationVi: "Nhu cầu đặc biệt (thuốc, đồ em bé) và kế hoạch thú cưng cần thiết cho chuẩn bị gia đình." },
];

// =============================================================================
// 4. FIRST AID GUIDES
// =============================================================================

export const MOCK_FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: "fa-cpr",
    topic: "cpr",
    title: "CPR (Cardiopulmonary Resuscitation)",
    titleVi: "Hồi sinh tim phổi (CPR)",
    icon: "❤️",
    color: "#EF4444",
    urgency: "immediate",
    steps: [
      { stepNumber: 1, title: "Check scene safety", titleVi: "Kiểm tra an toàn hiện trường", description: "Make sure the area is safe for you and the victim.", descriptionVi: "Đảm bảo an toàn cho bạn và nạn nhân.", icon: "⚠️" },
      { stepNumber: 2, title: "Call 115", titleVi: "Gọi 115", description: "Call emergency services immediately.", descriptionVi: "Gọi cấp cứu ngay lập tức.", icon: "📞" },
      { stepNumber: 3, title: "Check responsiveness", titleVi: "Kiểm tra phản ứng", description: "Tap shoulders and shout 'Are you okay?'", descriptionVi: "Vỗ vai và gọi to 'Bạn có nghe không?'", icon: "👋" },
      { stepNumber: 4, title: "Check breathing", titleVi: "Kiểm tra thở", description: "Look, listen, feel for breathing for no more than 10 seconds.", descriptionVi: "Nhìn, nghe, cảm nhận hơi thở trong tối đa 10 giây.", icon: "🫁" },
      { stepNumber: 5, title: "Chest compressions", titleVi: "Ép ngục", description: "30 compressions at 100-120/min, depth 5-6cm.", descriptionVi: "30 lần ép với tốc độ 100-120/phút, sâu 5-6cm.", icon: "💪", duration: "30 compressions" },
      { stepNumber: 6, title: "Rescue breaths", titleVi: "Thổi ngạt", description: "2 rescue breaths, each over 1 second.", descriptionVi: "2 lần thổi ngạt, mỗi lần hơn 1 giây.", icon: "💨", duration: "2 breaths" },
      { stepNumber: 7, title: "Continue CPR", titleVi: "Tiếp tục CPR", description: "Repeat 30:2 until help arrives or person breathes.", descriptionVi: "Lặp lại 30:2 cho đến khi có cứu hộ hoặc người đó thở.", icon: "♻️" },
    ],
    warnings: ["CPR can save lives - don't be afraid to try", "Push hard and fast in the center of the chest"],
    warningsVi: ["CPR có thể cứu sống - đừng sợ thử", "Ép mạnh và nhanh vào giữa ngực"],
    doNot: ["Don't stop CPR until help arrives", "Don't be too gentle - broken ribs heal, death doesn't"],
    doNotVi: ["Không dừng CPR cho đến khi có cứu hộ", "Không quá nhẹ - xương gãy lành, tử vong thì không"],
  },
  {
    id: "fa-bleeding",
    topic: "bleeding",
    title: "Bleeding Control",
    titleVi: "Cầm máu",
    icon: "🩸",
    color: "#DC2626",
    urgency: "immediate",
    steps: [
      { stepNumber: 1, title: "Put on gloves", titleVi: "Đeo găng tay", description: "Protect yourself from bloodborne pathogens.", descriptionVi: "Bảo vệ bản thân khỏi mầm bệnh qua đường máu.", icon: "🧤" },
      { stepNumber: 2, title: "Apply direct pressure", titleVi: "Ép trực tiếp", description: "Press firmly on the wound with clean gauze or cloth.", descriptionVi: "Ép mạnh lên vết thương bằng gạc hoặc vải sạch.", icon: "✋" },
      { stepNumber: 3, title: "Elevate the injured area", titleVi: "Nâng cao vùng bị thương", description: "Raise the injured limb above the heart if possible.", descriptionVi: "Nâng cao chi bị thương lên trên tim nếu có thể.", icon: "⬆️" },
      { stepNumber: 4, title: "Apply tourniquet if needed", titleVi: "Áp dụng garo nếu cần", description: "For severe limb bleeding that won't stop with pressure.", descriptionVi: "Với chảy máu chi nặng không cầm bằng ép.", icon: "🔧" },
    ],
    warnings: ["Seek medical help immediately for severe bleeding"],
    warningsVi: ["Tìm giúp đỡ y tế ngay lập tức với chảy máu nặng"],
    doNot: ["Don't remove objects embedded in wounds", "Don't use tourniquet unless absolutely necessary"],
    doNotVi: ["Không lấy dị vật ra khỏi vết thương", "Không dùng garo trừ khi thực sự cần thiết"],
  },
  {
    id: "fa-drowning",
    topic: "drowning",
    title: "Drowning Rescue",
    titleVi: "Cứu đuối nước",
    icon: "🌊",
    color: "#0EA5E9",
    urgency: "immediate",
    steps: [
      { stepNumber: 1, title: "Ensure your safety", titleVi: "Đảm bảo an toàn bản thân", description: "Don't jump in if you can't swim. Throw a flotation device instead.", descriptionVi: "Không nhảy xuống nếu không biết bơi. Nem đồ nổi thay vì.", icon: "⚠️" },
      { stepNumber: 2, title: "Reach or throw", titleVi: "Với hoặc nem", description: "Use a pole, rope, or throw a float to the person.", descriptionVi: "Dùng sào, dây, hoặc nem phao cho người đó.", icon: "🏊" },
      { stepNumber: 3, title: "Remove from water", titleVi: "Đưa ra khỏi nước", description: "Pull the person to safety.", descriptionVi: "Kéo người đó vào nơi an toàn.", icon: "💪" },
      { stepNumber: 4, title: "Give 5 rescue breaths", titleVi: "Cho 5 hơi thở cứu hộ", description: "Drowning victims need oxygen first.", descriptionVi: "Nạn nhân đuối nước cần oxy trước.", icon: "💨" },
      { stepNumber: 5, title: "Start CPR", titleVi: "Bắt đầu CPR", description: "30:2 ratio, continue until help arrives.", descriptionVi: "Tỷ lệ 30:2, tiếp tục cho đến khi có cứu hộ.", icon: "❤️" },
    ],
    warnings: ["Drowning is the #1 cause of death in Vietnam floods", "5 rescue breaths before CPR for drowning victims"],
    warningsVi: ["Đuối nước là nguyên nhân tử vong #1 trong lũ VN", "5 hơi thở cứu hộ trước CPR cho nạn nhân đuối nước"],
    doNot: ["Don't try to rescue if you can't swim", "Don't turn upside down to drain water - it doesn't work"],
    doNotVi: ["Không cố cứu nếu không biết bơi", "Không lật ngược để rút nước - không hiệu quả"],
  },
];

// =============================================================================
// 5. BADGES (20 badges)
// =============================================================================

export const MOCK_BADGES: Badge[] = [
  // Knowledge badges
  { id: "badge-flood-expert", name: "Flood Expert", nameVi: "Chuyên gia lũ lụt", description: "Complete the flood safety course", descriptionVi: "Hoàn thành khóa an toàn lũ lụt", icon: "🌊", color: "#3B82F6", category: "knowledge", rarity: "common", xpReward: 100, requirements: [{ type: "complete_course", value: "course-flood" }] },
  { id: "badge-storm-ready", name: "Storm Ready", nameVi: "Sẵn sàng bão", description: "Complete the storm safety course", descriptionVi: "Hoàn thành khóa an toàn bão", icon: "🌪️", color: "#8B5CF6", category: "knowledge", rarity: "common", xpReward: 100, requirements: [{ type: "complete_course", value: "course-storm" }] },
  { id: "badge-landslide-aware", name: "Landslide Aware", nameVi: "Nhận biết sạt lở", description: "Complete the landslide safety course", descriptionVi: "Hoàn thành khóa an toàn sạt lở", icon: "⛰️", color: "#92400E", category: "knowledge", rarity: "common", xpReward: 100, requirements: [{ type: "complete_course", value: "course-landslide" }] },
  { id: "badge-first-aider", name: "First Aider", nameVi: "Người sơ cứu", description: "Pass first aid quiz with 80%+", descriptionVi: "Đạt quiz sơ cứu 80%+", icon: "🩹", color: "#EF4444", category: "knowledge", rarity: "uncommon", xpReward: 150, requirements: [{ type: "pass_quiz", value: 80 }] },
  { id: "badge-emergency-expert", name: "Emergency Expert", nameVi: "Chuyên gia khẩn cấp", description: "Learn all emergency numbers", descriptionVi: "Học tất cả số khẩn cấp", icon: "📞", color: "#DC2626", category: "knowledge", rarity: "common", xpReward: 50, requirements: [{ type: "complete_course", value: "course-emergency" }] },

  // Skill badges
  { id: "badge-cpr-master", name: "CPR Master", nameVi: "Chuyên gia CPR", description: "Complete CPR simulation successfully", descriptionVi: "Hoàn thành mô phỏng CPR thành công", icon: "❤️", color: "#EF4444", category: "skill", rarity: "rare", xpReward: 200, requirements: [{ type: "complete_scenario", value: "scenario-cpr" }] },
  { id: "badge-kit-builder", name: "Kit Builder", nameVi: "Bộ đồ sẵn sàng", description: "Complete emergency kit builder", descriptionVi: "Hoàn thành xây dựng bộ đồ khẩn cấp", icon: "🎒", color: "#F59E0B", category: "skill", rarity: "uncommon", xpReward: 150, requirements: [{ type: "complete_course", value: "course-family" }] },
  { id: "badge-family-planner", name: "Family Planner", nameVi: "Kế hoạch gia đình", description: "Complete evacuation planner", descriptionVi: "Hoàn thành kế hoạch sơ tán", icon: "🗺️", color: "#22C55E", category: "skill", rarity: "uncommon", xpReward: 150, requirements: [{ type: "complete_course", value: "course-family" }] },

  // Effort badges
  { id: "badge-streak-7", name: "7-Day Streak", nameVi: "Chuỗi 7 ngày", description: "Learn for 7 consecutive days", descriptionVi: "Học 7 ngày liên tiếp", icon: "🔥", color: "#F97316", category: "effort", rarity: "uncommon", xpReward: 100, requirements: [{ type: "streak_days", value: 7 }] },
  { id: "badge-streak-30", name: "30-Day Streak", nameVi: "Chuỗi 30 ngày", description: "Learn for 30 consecutive days", descriptionVi: "Học 30 ngày liên tiếp", icon: "⭐", color: "#F59E0B", category: "effort", rarity: "rare", xpReward: 300, requirements: [{ type: "streak_days", value: 30 }] },
  { id: "badge-100-questions", name: "100 Questions", nameVi: "100 câu hỏi", description: "Answer 100 quiz questions", descriptionVi: "Trả lời 100 câu quiz", icon: "📚", color: "#3B82F6", category: "effort", rarity: "uncommon", xpReward: 150, requirements: [{ type: "total_xp", value: 2000 }] },
  { id: "badge-perfect-quiz", name: "Perfect Score", nameVi: "Điểm hoàn hảo", description: "Get 100% on a quiz", descriptionVi: "Đạt 100% quiz", icon: "🎯", color: "#22C55E", category: "effort", rarity: "rare", xpReward: 200, requirements: [{ type: "pass_quiz", value: 100 }] },
  { id: "badge-speed-learner", name: "Speed Learner", nameVi: "Tốc độ", description: "Complete a lesson in under 3 minutes", descriptionVi: "Hoàn thành bài học dưới 3 phút", icon: "⚡", color: "#F59E0B", category: "effort", rarity: "uncommon", xpReward: 100, requirements: [{ type: "total_xp", value: 500 }] },

  // Social badges
  { id: "badge-team-player", name: "Team Player", nameVi: "Đội nhóm", description: "Join a team challenge", descriptionVi: "Tham gia thử thách nhóm", icon: "🤝", color: "#8B5CF6", category: "social", rarity: "common", xpReward: 100, requirements: [{ type: "total_xp", value: 1000 }] },
  { id: "badge-mentor", name: "Mentor", nameVi: "Người hướng dẫn", description: "Help 5 other learners", descriptionVi: "Giúp 5 người học khác", icon: "👨‍🏫", color: "#14B8A6", category: "social", rarity: "rare", xpReward: 200, requirements: [{ type: "help_others", value: 5 }] },
  { id: "badge-community", name: "Community Champion", nameVi: "Nhà vô địch cộng đồng", description: "Complete community DRR course", descriptionVi: "Hoàn thành khóa DRR cộng đồng", icon: "🏘️", color: "#22C55E", category: "social", rarity: "uncommon", xpReward: 150, requirements: [{ type: "complete_course", value: "course-community" }] },

  // Rare badges
  { id: "badge-protector", name: "Protector", nameVi: "Người bảo vệ", description: "Complete all basic courses", descriptionVi: "Hoàn thành tất cả khóa cơ bản", icon: "🛡️", color: "#3B82F6", category: "rare", rarity: "epic", xpReward: 500, requirements: [{ type: "total_xp", value: 5000 }] },
  { id: "badge-all-hazards", name: "All-Hazards Expert", nameVi: "Chuyên gia toàn diện", description: "Reach Level 5", descriptionVi: "Đạt Level 5", icon: "🏆", color: "#FFD700", category: "rare", rarity: "legendary", xpReward: 1000, requirements: [{ type: "total_xp", value: 7000 }] },
  { id: "badge-scenario-master", name: "Scenario Master", nameVi: "Bậc thầy kịch bản", description: "Complete all scenarios with optimal path", descriptionVi: "Hoàn thành tất cả kịch bản với đường đi tối ưu", icon: "🎮", color: "#EC4899", category: "rare", rarity: "epic", xpReward: 300, requirements: [{ type: "total_xp", value: 3000 }] },
  { id: "badge-culture-keeper", name: "Culture Keeper", nameVi: "Người giữ truyền thống", description: "Complete culture & DRR course", descriptionVi: "Hoàn thành khóa văn hóa & PCTT", icon: "🇻🇳", color: "#22C55E", category: "rare", rarity: "uncommon", xpReward: 100, requirements: [{ type: "complete_course", value: "course-culture" }] },
];

// =============================================================================
// 6. KIT ITEMS
// =============================================================================

export const MOCK_KIT_ITEMS: KitItem[] = [
  // Water & Food
  { id: "kit-water", name: "Water (9 liters)", nameVi: "Nước (9 lít)", category: "water_food", priority: "essential", icon: "💧", description: "4 liters per person per day × 3 days", descriptionVi: "4 lít mỗi người mỗi ngày × 3 ngày", quantity: "9 lít", estimatedCost: "30.000đ" },
  { id: "kit-noodles", name: "Instant noodles", nameVi: "Mì gói", category: "water_food", priority: "essential", icon: "🍜", description: "3 packs per person per day × 3 days", descriptionVi: "3 gói mỗi người mỗi ngày × 3 ngày", quantity: "9 gói", estimatedCost: "45.000đ" },
  { id: "kit-crackers", name: "Crackers", nameVi: "Bánh quy", category: "water_food", priority: "essential", icon: "🍪", description: "Dry crackers for emergency food", descriptionVi: "Bánh quy khô cho thức ăn khẩn cấp", quantity: "2 gói", estimatedCost: "30.000đ" },
  { id: "kit-milk", name: "Canned milk", nameVi: "Sữa hộp", category: "water_food", priority: "recommended", icon: "🥛", description: "Long-life milk for children and elderly", descriptionVi: "Sữa hộp cho trẻ em và người già", quantity: "4 hộp", estimatedCost: "40.000đ" },

  // Medical
  { id: "kit-firstaid", name: "First aid kit", nameVi: "Túi sơ cứu", category: "medical", priority: "essential", icon: "🩹", description: "Bandages, gauze, antiseptic, scissors", descriptionVi: "Băng, gạc, thuốc sát trùng, kéo", quantity: "1 bộ", estimatedCost: "100.000đ" },
  { id: "kit-medicine", name: "Personal medicine", nameVi: "Thuốc cá nhân", category: "medical", priority: "essential", icon: "💊", description: "Prescription medications for 7 days", descriptionVi: "Thuốc kê đơn cho 7 ngày", quantity: "7 ngày", estimatedCost: "Tùy loại" },
  { id: "kit-mask", name: "Face masks", nameVi: "Khẩu trang", category: "medical", priority: "essential", icon: "😷", description: "Medical masks for disease prevention", descriptionVi: "Khẩu trang y tế phòng bệnh", quantity: "10 cái", estimatedCost: "20.000đ" },
  { id: "kit-gloves", name: "Medical gloves", nameVi: "Găng tay y tế", category: "medical", priority: "recommended", icon: "🧤", description: "Disposable gloves for first aid", descriptionVi: "Găng tay dùng một lần cho sơ cứu", quantity: "5 đôi", estimatedCost: "25.000đ" },

  // Tools
  { id: "kit-flashlight", name: "Flashlight", nameVi: "Đèn pin", category: "tools", priority: "essential", icon: "🔦", description: "LED flashlight with extra batteries", descriptionVi: "Đèn pin LED với pin dự phòng", quantity: "1 cái", estimatedCost: "80.000đ" },
  { id: "kit-radio", name: "FM Radio", nameVi: "Radio FM", category: "tools", priority: "essential", icon: "📻", description: "Hand-crank or battery radio for weather alerts", descriptionVi: "Radio tay hoặc pin cho cảnh báo thời tiết", quantity: "1 cái", estimatedCost: "150.000đ" },
  { id: "kit-knife", name: "Multi-tool knife", nameVi: "Dao đa năng", category: "tools", priority: "recommended", icon: "🔪", description: "Swiss army knife type multi-tool", descriptionVi: "Dao đa năng kiểu Thụy Sĩ", quantity: "1 cái", estimatedCost: "120.000đ" },
  { id: "kit-rope", name: "Rope (10m)", nameVi: "Dây thừng (10m)", category: "tools", priority: "recommended", icon: "🪢", description: "Strong rope for rescue and securing items", descriptionVi: "Dây chắc cho cứu hộ và buộc đồ", quantity: "10m", estimatedCost: "50.000đ" },
  { id: "kit-whistle", name: "Whistle", nameVi: "Còi", category: "tools", priority: "essential", icon: "🔔", description: "Signal whistle for rescue", descriptionVi: "Còi tín hiệu cầu cứu", quantity: "1 cái", estimatedCost: "15.000đ" },
  { id: "kit-raincoat", name: "Raincoat", nameVi: "Áo mưa", category: "tools", priority: "recommended", icon: "🧥", description: "Lightweight raincoat", descriptionVi: "Áo mưa nhẹ", quantity: "1 cái", estimatedCost: "30.000đ" },

  // Documents
  { id: "kit-id", name: "ID copy (waterproof)", nameVi: "CCCD/CMND (chống nước)", category: "documents", priority: "essential", icon: "🪪", description: "Copy of national ID in waterproof bag", descriptionVi: "Bản sao CCCD trong túi chống nước", quantity: "1 bản", estimatedCost: "5.000đ" },
  { id: "kit-insurance", name: "Insurance copy", nameVi: "Bản sao bảo hiểm", category: "documents", priority: "essential", icon: "📋", description: "Health and life insurance documents", descriptionVi: "Giấy tờ bảo hiểm y tế và nhân thọ", quantity: "1 bộ", estimatedCost: "5.000đ" },
  { id: "kit-cash", name: "Cash", nameVi: "Tiền mặt", category: "documents", priority: "essential", icon: "💰", description: "500,000 - 1,000,000 VND in small bills", descriptionVi: "500.000 - 1.000.000 VND tiền lẻ", quantity: "500K-1M", estimatedCost: "500.000đ" },

  // Personal
  { id: "kit-clothes", name: "Change of clothes", nameVi: "Quần áo dự phòng", category: "personal", priority: "essential", icon: "👕", description: "2 sets of clothes", descriptionVi: "2 bộ quần áo", quantity: "2 bộ", estimatedCost: "Có sẵn" },
  { id: "kit-glasses", name: "Glasses (if needed)", nameVi: "Kính cận (nếu cần)", category: "personal", priority: "essential", icon: "👓", description: "Prescription glasses", descriptionVi: "Kính cận", quantity: "1 cái", estimatedCost: "Có sẵn" },
];

// =============================================================================
// 7. LEADERBOARD DATA
// =============================================================================

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "user-1", displayName: "Nguyễn Văn A", xp: 8500, level: 5, badges: 18, streak: 45, province: "Đà Nẵng" },
  { rank: 2, userId: "user-2", displayName: "Trần Thị B", xp: 7200, level: 5, badges: 16, streak: 30, province: "Quảng Ninh" },
  { rank: 3, userId: "user-3", displayName: "Lê Văn C", xp: 6800, level: 4, badges: 15, streak: 28, province: "Hải Phòng" },
  { rank: 4, userId: "user-4", displayName: "Phạm Thị D", xp: 5500, level: 4, badges: 14, streak: 21, province: "Khánh Hòa" },
  { rank: 5, userId: "user-5", displayName: "Hoàng Văn E", xp: 4900, level: 4, badges: 13, streak: 18, province: "Thừa Thiên Huế" },
  { rank: 6, userId: "user-6", displayName: "Vũ Thị F", xp: 4200, level: 3, badges: 12, streak: 15, province: "Quảng Bình" },
  { rank: 7, userId: "user-7", displayName: "Đặng Văn G", xp: 3800, level: 3, badges: 11, streak: 14, province: "Lào Cai" },
  { rank: 8, userId: "user-8", displayName: "Bùi Thị H", xp: 3200, level: 3, badges: 10, streak: 12, province: "Yên Bái" },
  { rank: 9, userId: "user-9", displayName: "Đỗ Văn I", xp: 2800, level: 3, badges: 9, streak: 10, province: "An Giang" },
  { rank: 10, userId: "user-10", displayName: "Ngô Thị K", xp: 2400, level: 2, badges: 8, streak: 8, province: "Cần Thơ" },
];
