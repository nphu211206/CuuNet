# SUPER MASTER PLAN: Phase 7 - Module Giáo Dục & Nhận Thức (Education & Awareness)

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1-6 đã hoàn thành:
- Phase 1: Bản đồ Thiên Tai ✅
- Phase 2: AI Dự Đoán ✅
- Phase 3: Báo cáo Cộng đồng ✅
- Phase 4: Cảnh Báo & SOS ✅
- Phase 5: Phối Hợp Cứu Trợ ✅ (24 files, ~12,800 lines)
- Phase 6: Trực Quan Hóa Dữ Liệu ✅ (20 files, ~6,350 lines)

**Phase 7: Module Giáo Dục & Nhận Thức** - module trang bị kiến thức và kỹ năng sinh tồn cho người dân. Đây là "heart" của luận văn.

**Tại sao module này là "life-saving education":**
- Phase 1-6: Giám sát → Dự đoán → Báo cáo → Cảnh báo → Cứu hộ → Trực quan = **HỆ THỐNG**
- Phase 7: Giáo dục → Huấn luyện → Thực hành → Phòng ngừa = **CON NGƯỜI**
- "Phòng ngừa hơn chữa trị" - giáo dục là cách hiệu quả nhất để giảm thương vong
- Hội đồng: "Hệ thống không chỉ CỨU HỘ mà còn GIÁO DỤC người dân tự bảo vệ mình"

---

## Phần I: Phân tích Vấn đề - Giáo dục PCTT Việt Nam

### 1.1. Thực trạng hiện tại

| Vấn đề | Mô tả | Nguồn |
|--------|--------|-------|
| **Giáo dục PCTT chưa hệ thống** | Chỉ có tuần lễ PCTT mỗi năm, không có chương trình liên tục | VNDMA Report |
| **Thiếu nội dung tương tác** | Tài liệu PDF, brochure một chiều | UNICEF Assessment |
| **Không có gamification** | Người dân không hứng thú học | UNESCO DRR Gap |
| **Thiếu kịch bản thực tế** | Nội dung chung chung, không theo vùng miền | IFRC Vietnam |
| **Không có theo dõi tiến trình** | Không biết ai đã học, ai chưa | Post-Yagi 2024 |
| **Thiếu kỹ năng thực hành** | Chỉ biết lý thuyết, không biết sơ cứu, sơ tán | VNRC Assessment |
| **Không có đa ngôn ngữ** | Chỉ tiếng Việt, không cho dân tộc thiểu số | UNDP Vietnam |
| **Thiếu offline capability** | Cần internet, vùng sâu không truy cập được | WB Vietnam |

### 1.2. Khoảng cách CứuNet có thể lấp đầy

| Khoảng cách | Giải pháp CứuNet | Chuẩn tham khảo |
|-------------|-----------------|-----------------|
| Không có hệ thống giáo dục | Khóa học microlearning (5 phút/bài) | UNESCO CSS |
| Không có gamification | Điểm, huy hiệu, bảng xếp hạng | Ready.gov |
| Không có kịch bản tương tác | Mô phỏng tình huống có lựa chọn | Japan Bousai |
| Không có theo dõi tiến trình | Dashboard tiến trình học | UNICEF CC-DRR |
| Không có kỹ năng thực hành | Hướng dẫn sơ cứu từng bước | IFRC First Aid |
| Không có đa ngôn ngữ | Tiếng Việt + dân tộc thiểu số | IFRC Vietnam |
| Không có offline | localStorage + service worker | PWA Pattern |
| Không có kiểm tra | Quiz thích ứng + spaced repetition | EdTech Best Practice |

---

## Phần II: Nghiên cứu Quốc tế - Giáo dục PCTT Toàn cầu

### 2.1. UNESCO - Comprehensive School Safety (CSS)

**3 Pillars:**
1. **Safe Learning Facilities** - An toàn cấu trúc trường học
2. **School Disaster Management** - Kế hoạch PCTT trường học
3. **Risk Reduction & Resilience Education** - Giáo dục giảm thiểu rủi ro

**Sendai Framework Priority 4:**
- Tích hợp DRR vào chương trình giáo dục các cấp
- Số trường có kế hoạch PCTT
- Tần suất diễn tập (khuyến nghị: hàng tháng cho vùng địa chấn)
- Đào tạo giáo viên về DRR

**Mô hình tích hợp DRR:**
- **Model A - Cross-Curricular**: DRR tích hợp vào môn hiện có (Địa lý, Khoa học, Toán)
- **Model B - Standalone**: Môn riêng (Nhật Bản, Philippines)
- **Model C - Project-Based**: Học sinh đánh giá rủi ro cộng đồng

### 2.2. UNICEF - Child-Centered DRR

**Nguyên tắc cốt lõi:**
1. Trẻ em có quyền tham gia quyết định DRR
2. Giáo dục DRR phải phù hợp lứa tuổi và hòa nhập
3. Trẻ em là tác nhân thay đổi trong gia đình và cộng đồng
4. Giáo dục DRR phải xây dựng trên kiến thức hiện có
5. Tiếp cận nhạy cảm giới

**Nội dung theo lứa tuổi:**
| Độ tuổi | Nội dung |
|---------|----------|
| 4-6 | Nhận biết nguy hiểm, giữ bình tĩnh, biết tên và địa chỉ |
| 6-9 | Các loại thiên tai, sơ cứu cơ bản, kế hoạch khẩn cấp gia đình |
| 9-12 | Đánh giá rủi ro, bản đồ nguy hiểm cộng đồng, kỹ năng sơ cứu |
| 12-15 | Biến đổi khí hậu, bản đồ rủi ro, hỗ trợ tâm lý |
| 15-18 | Hệ thống PCTT, điều phối tình nguyện, lãnh đạo khẩn cấp |

### 2.3. IFRC - Volunteer Training

**Level 1 - Community Volunteer (16 giờ):**
- Nguyên tắc Chữ thập đỏ & DRR (2h)
- Hiểu nguy hiểm cộng đồng (2h)
- Đánh giá rủi ro cộng đồng (4h)
- Kỹ năng nâng cao nhận thức (4h)
- Phản ứng khẩn cấp cơ bản (2h)
- Báo cáo và tài liệu (2h)

**Sơ cứu theo IFRC (8 giờ):**
- Đánh giá hiện trường an toàn
- Khảo sát chính (DRSABCD)
- CPR cho người lớn, trẻ em, sơ sinh
- Sử dụng AED
- Quản lý nghẹt thở
- Kiểm soát chảy máu và chăm sóc vết thương

### 2.4. Nhật Bản - Bousai Kyouiku (防災教育)

**Chương trình theo cấp học:**
- **Tiểu học lớp 1-2**: Môn "An toàn" - nhận biết nguy hiểm, sơ tán cơ bản
- **Tiểu học lớp 3-4**: Tích hợp Khoa học - thời tiết, động đất, núi lửa
- **Tiểu học lớp 5-6**: "Học tập tổng hợp" - bản đồ nguy hiểm cộng đồng
- **THCS**: Xã hội (lịch sử thiên tai), Khoa học (địa chấn), Thể dục (sơ cứu)
- **THPT**: Giáo dục công dân (quản lý PCTT), Địa lý (quy hoạch đô thị)

**Ngày Phòng chống Thiên tai (1/9):**
- Kỷ niệm Đại động đất Kantō 1923
- Diễn tập toàn quốc hàng năm
- 10+ triệu người tham gia
- Mô phỏng động đất dữ liệu thực

**Thực hành độc đáo Nhật Bản:**
- **"Úp, Che, Giữ"**: Tập từ 3 tuổi
- **Tendenko (てんでんこ)**: "Chạy ngay, đừng đợi người khác"
- **Hệ thống bạn bè**: Học sinh lớn cặp với học sinh nhỏ khi sơ tán
- **Manga/Anime giáo dục PCTT**: "Bousai Manga", video NHK 5 phút

**Trung tâm mô phỏng:**
- **DRI Kobe**: Mô phỏng động đất, mê cung cháy, VR sóng thần
- **Tokyo Rinkai (Sona Area)**: Rạp phim đa giác quan

### 2.5. Philippines - CBDRM

**Quy trình CBDRM 6 bước:**
1. Tổ chức cộng đồng
2. Đánh giá rủi ro (participatory 3D modeling)
3. Kế hoạch giảm thiểu rủi ro
4. Triển khai
5. Giám sát đánh giá
6. Bền vững

**Diễn tập toàn quốc (NSED):**
- Hàng quý, giao thức "Úp, Che, Giữ"
- Hàng triệu người tham gia
- Truyền thông xã hội: #NSED

### 2.6. Nền tảng Giáo dục Số

**FEMA Ready.gov:**
- Xây dựng kế hoạch khẩn cấp gia đình (interactive)
- Bộ dụng cụ khẩn cấp (checklist tùy chỉnh)
- "Ready Kids" cho trẻ em

**Gamification (Octalysis Framework - 8 Core Drives):**

| Core Drive | Ứng dụng PCTT |
|-----------|---------------|
| 1. Epic Meaning | "Mỗi bài học giúp cộng đồng sống sót" |
| 2. Accomplishment | XP, levels, skill tree |
| 3. Creativity | Thiết kế kế hoạch gia đình, sandbox |
| 4. Ownership | Bộ dụng cụ ảo, badge collection |
| 5. Social Influence | Bảng xếp hạng, team challenges |
| 6. Scarcity | Thử thách theo mùa, limited badges |
| 7. Unpredictability | Surprise quiz, random scenarios |
| 8. Loss Avoidance | Streak decay, "điểm chuẩn bị đang giảm" |

**Spaced Repetition (SM-2 Algorithm):**
| Review # | Interval |
|----------|----------|
| 1st | 1 ngày |
| 2nd | 6 ngày |
| 3rd | ~15 ngày |
| 4th | ~30 ngày |
| 5th | ~60+ ngày |

**Microlearning (3-7 phút/bài):**
```
Cấu trúc bài học (5 phút):
├── Hook (30s): Tình huống kịch tính
├── Nội dung (2.5m): 3-5 điểm chính
├── Thực hành (1.5m): Quiz 3 câu
└── Tóm tắt (30s): Một hành động ghi nhớ
```

---

## Phần III: Giáo dục PCTT Việt Nam (Chi tiết)

### 3.1. Khung pháp lý

**Luật Phòng, chống thiên tai 2013:**
- Điều 12: Trách nhiệm giáo dục, tuyên truyền PCTT
- Điều 13: Đào tạo, bồi dưỡng chuyên ngành PCTT

**Thông tư 09/2016/TT-BGDĐT:**
- Quy định giáo dục PCTT trong cơ sở giáo dục
- Tích hợp vào chương trình chính khóa
- Diễn tập tối thiểu 2 lần/năm

### 3.2. Số điện thoại khẩn cấp

| Số | Đơn vị | Chức năng |
|----|--------|-----------|
| **112** | Ban Chỉ đạo PCTT TW | Tìm kiếm cứu nạn, cứu hộ thiên tai |
| **113** | Công an | An ninh trật tự, cứu hộ cộng đồng |
| **114** | Phòng cháy chữa cháy | Cứu hỏa, cứu nạn cháy nổ |
| **115** | Cấp cứu y tế | Cấp cứu y tế, vận chuyển bệnh nhân |

### 3.3. Kỹ năng sống sót theo loại thiên tai

**Lũ lụt:**
- Di chuyển đến nơi cao, tránh dòng nước chảy xiết
- Không đi qua cầu ngập
- Nếu bị cuốn: nằm ngửa, chân hướng xuống hạ lưu
- Tìm vật nổi: bình nhựa, thùng nhựa, cây cối

**Bão (Timeline chuẩn bị):**
- **72h trước**: Theo dõi bản tin, kiểm tra nhà cửa, chuẩn bị đồ khô
- **48h trước**: Cắt cành cây, gia cố mái, chuẩn bị bao cát
- **24h trước**: Đưa thuyền vào nơi an toàn, sạc đầy pin
- **12h trước**: Ở trong nhà, đóng kín cửa, cắt điện nếu cần
- **6h trước**: Không ra ngoài, nghe radio
- **1h trước**: Toàn bộ trong nơi trú an toàn

**Sạt lở đất (Dấu hiệu cảnh báo):**
- Vết nứt trên đất, tường nhà bị nứt
- Nước tự nhiên chảy ra từ sườn núi
- Cây nghiêng một phía
- Tieng động lạ từ lòng đất
- Đất rung nhẹ

**Động đất:**
- **DROP - COVER - HOLD ON**: Ngồi xuống, núp dưới bàn, bám chặt
- Tránh cửa sổ, tủ kệ
- Không chạy ra ngoài khi ở tầng cao
- Sau khi rung: di chuyển ra khỏi nhà theo cầu thang thoát hiểm

**Sóng thần:**
- Nước biển rút nhanh và bất thường
- Tieng động lạ từ biển
- Chạy lên nơi cao ít nhất 30m
- Đi bộ, không lái xe
- Không quay lại biển sau đợt sóng đầu tiên

### 3.4. Sơ cấp cứu Việt Nam (VNRC 16 giờ)

**Quy trình BCD:**
- **B**ình tĩnh - Giữ bình tĩnh, đánh giá tình hình
- **C**an thiệp - Thực hiện sơ cứu
- **Đ**ánh giá - Đánh giá kết quả, gọi cấp cứu

**CPR (30:2):**
- Ép tim 30 lần (tốc độ 100-120/phút)
- Thổi ngạt 2 lần
- Lặp lại cho đến khi xe cấp cứu đến

**Cầm máu:**
- Ép trực tiếp lên vết thương
- Nâng cao vùng bị thương
- Sử dụng garo nếu chảy máu chi

**Rắn cắn trong lũ:**
- Nghỉ ngơi, bất động chi bị cắn
- Không ga-rô, không hút máu
- Vẽ hình rắn (nếu thấy) để bác sĩ biết loại
- Đến bệnh viện có khang độc gần nhất

**Cứu đuối nước:**
- Đảm bảo an toàn bản thân trước
- Nem đồ nổi (bình nhựa, dây, áo khoác)
- Nếu phải bơi: tiếp cận từ sau, giữ khoảng cách 1-2m
- CPR ngay sau khi đưa ra khỏi nước (bắt đầu bằng 5 hơi thở đầu tiên)

### 3.5. Kế hoạch hộ gia đình

**Bộ đồ dùng 72 giờ:**
- **Nước & Thức ăn**: 9 lít nước, mì gói, bánh quy, khoai lang khô
- **Y tế**: Túi sơ cứu, thuốc cá nhân, khẩu trang, găng tay
- **Dụng cụ**: Đèn pin, radio FM, dao đa năng, dây thừng, còi
- **Giấy tờ**: Bản sao CCCD, giấy khai sinh, bảo hiểm (bọc nilon)
- **Cá nhân**: Quần áo dự phòng, áo mưa, kính cận (nếu cần)

**Kế hoạch liên lạc:**
- Danh sách liên lạc: số điện thoại tất cả thành viên
- Điểm tập hợp: 4 cấp (trước nhà → nhà hàng xóm → trường học → UBND)
- Người liên lạc xa: 1 người ở tỉnh khác làm điểm trung tam

### 3.6. Vai trò cộng đồng

**Trưởng thôn:** Phát hiện cảnh báo sớm, tổ chức sơ tán, quản lý tài nguyên
**Ủy ban PCTT cấp xã:** Kế hoạch PCTT, đào tạo, quản lý nguồn lực cứu hộ
**Đội TNV:** Hỗ trợ sơ tán, cứu hộ ban đầu, truyền thông
**Hội Phụ nữ:** Hỗ trợ trẻ em, phụ nữ có thai, người già; chuẩn bị thức ăn
**Đoàn Thanh niên:** Lực lượng cứu hộ xung phong, hỗ trợ kỹ thuật

### 3.7. Yếu tố văn hóa

**Phật giáo:** "Vô thường" - thiên tai là 1 phần cuộc sống; "Từ bi" - giúp đỡ người khác
**Tương thân tương ái:** "Lá lành đùm lá rách" - cộng đồng giúp đỡ lẫn nhau
**54 dân tộc:** Nhiều dân tộc thiểu số ở vùng thiên tai, cần đa ngôn ngữ
**Vai trò giới:** Phụ nữ chăm sóc gia đình, nam giới cứu hộ, trẻ em cần bảo vệ đặc biệt

### 3.8. Bệnh sau thiên tai

**Bệnh truyền nhiễm:** Tiêu chảy, thương hàn, leptospirosis, sốt xuất huyết
**Bệnh về da:** Viêm da tiếp xúc, nấm da
**Sức khỏe tâm lý:** PTSD, lo âu, trầm cảm
**Phòng bệnh:** Uống nước đã xử lý, ăn chín uống sôi, rửa tay bằng xà phòng

### 3.9. Bài học từ thảm họa lịch sử

**Lũ Huế 1999 (500+ chết):**
- Hệ thống cảnh báo kém, nhà cửa không chịu lũ
- Bài học: Xây dựng hệ thống cảnh báo, nhà chống lũ, kế hoạch sơ tán

**Bão Damrey 2017 (Nha Trang):**
- Nhà cửa chịu bão kém, mái tôn bị bay
- Bài học: Gia cố mái, đào tạo kỹ năng cho trẻ em

**Lũ miền Trung 2020 - 13 chiến sĩ hy sinh tại Rào Trăng:**
- Sạt lở xảy ra ban đêm, cảnh báo sạt lở kém
- Bài học: Hệ thống cảnh báo tự động, sơ tán sớm

**Bão Yagi 2024 (300+ chết):**
- Bão rất mạnh cấp 14-15, lũ quét miền núi
- Bài học: Cảnh báo sớm hơn, nhà chống bão mạnh hơn, sơ tán sớm hơn

---

## Phần IV: Scope - Module Giáo Dục & Nhận Thức

### Tính năng chính (14 features)

#### Khóa học (3 features)
1. **Microlearning Modules** - Bài học 5 phút, 8 chủ đề
2. **Learning Paths** - Lộ trình học theo cấp độ (5 levels)
3. **Certification System** - Chứng nhận hoàn thành

#### Tương tác (3 features)
4. **Interactive Scenarios** - Mô phỏng tình huống có lựa chọn (3 kịch bản)
5. **Quiz System** - Kiểm tra thích ứng + spaced repetition (SM-2)
6. **Drill Simulator** - Mô phỏng diễn tập

#### Thực hành (3 features)
7. **First Aid Guide** - Hướng dẫn sơ cứu từng bước (5 chủ đề)
8. **Emergency Kit Builder** - Xây dựng bộ dụng cụ khẩn cấp
9. **Evacuation Planner** - Lập kế hoạch sơ tán gia đình

#### Cộng đồng (3 features)
10. **Progress Dashboard** - Dashboard tiến trình học + skill tree
11. **Badge Collection** - Bộ sưu tập huy hiệu (20 badges)
12. **Leaderboard** - Bảng xếp hạng (cá nhân + cộng đồng)

#### Thông tin (2 features)
13. **Emergency Numbers** - Danh bạ khẩn cấp VN (112, 113, 114, 115)
14. **Survival Guides** - Hướng dẫn sinh tồn theo loại thiên tai

---

## Phần V: Gamification Design (Octalysis Framework)

### 5.1. 8 Core Drives áp dụng cho CứuNet

| Core Drive | Cơ chế | Triển khai |
|-----------|--------|------------|
| **Epic Meaning** | "Mỗi bài học giúp cộng đồng sống sót" | Community impact meter, "Protector" role |
| **Accomplishment** | XP, levels, skill tree | Level 1-5, skill points theo domain |
| **Creativity** | Thiết kế kế hoạch gia đình | Drag-drop kit builder, route planner |
| **Ownership** | Bộ dụng cụ ảo, badge collection | Inventory system, item rarity |
| **Social Influence** | Bảng xếp hạng, team challenges | Family teams, neighborhood map |
| **Scarcity** | Thử thách theo mùa | "Monsoon Prep Week", daily streak |
| **Unpredictability** | Surprise quiz, random scenarios | Random safety alerts, mystery badges |
| **Loss Avoidance** | Streak decay, "điểm chuẩn bị đang giảm" | Streak freeze, consequence simulation |

### 5.2. Progression System

```
Level 1: "Người mới" (Newcomer)     → 0-500 XP     → Cơ bản
Level 2: "Học viên" (Student)        → 500-1500 XP  → Trung cấp
Level 3: "Thành viên" (Member)       → 1500-3500 XP → Thực hành
Level 4: "Huấn luyện viên" (Trainer) → 3500-7000 XP → Đào tạo người khác
Level 5: "Chuyên gia" (Expert)       → 7000+ XP     → Lãnh đạo cộng đồng
```

### 5.3. Badge System (20 badges)

**Knowledge Badges:**
1. 🌊 Chuyên gia lũ lụt - Hoàn thành khóa lũ
2. 🌪️ Sẵn sàng bão - Hoàn thành khóa bão
3. ⛰️ Nhận biết sạt lở - Hoàn thành khóa sạt lở
4. 🏔️ Phản ứng động đất - Hoàn thành khóa động đất
5. ☀️ Chống hạn hán - Hoàn thành khóa hạn hán

**Skill Badges:**
6. 🩹 Người sơ cứu - Đạt quiz sơ cứu 80%+
7. 🚑 Chuyên gia CPR - Hoàn thành mô phỏng CPR
8. 🎒 Bộ đồ sẵn sàng - Hoàn thành kit builder
9. 🗺️ Kế hoạch gia đình - Hoàn thành evacuation planner
10. 📞 Thông tin viên - Biết tất cả số khẩn cấp

**Effort Badges:**
11. 🔥 Chuỗi 7 ngày - Học 7 ngày liên tiếp
12. ⭐ Chuỗi 30 ngày - Học 30 ngày liên tiếp
13. 📚 100 câu hỏi - Trả lời 100 câu quiz
14. 🎯 Điểm hoàn hảo - Đạt 100% quiz
15. ⚡ Tốc độ - Hoàn thành bài học <3 phút

**Social Badges:**
16. 🤝 Đội nhóm - Tham gia team challenge
17. 👨‍🏫 Người hướng dẫn - Giúp 5 người khác
18. 🏘️ Cộng đồng - Đóng góp cho cộng đồng

**Rare Badges:**
19. 🌟 Người bảo vệ - Hoàn thành tất cả khóa cơ bản
20. 🏆 Chuyên gia toàn diện - Đạt Level 5

### 5.4. Quiz Design (Bloom's Taxonomy)

| Level | Tỷ lệ | Loại câu hỏi |
|-------|--------|--------------|
| Remember | 20% | Trắc nghiệm, đúng/sai |
| Understand | 25% | Ghép đôi, giải thích |
| Apply | 25% | Kịch bản, tình huống |
| Analyze | 15% | So sánh, nguyên nhân-kết quả |
| Evaluate | 10% | Đánh giá, phê bình |
| Create | 5% | Thiết kế, tạo kế hoạch |

### 5.5. Behavioral Change (Fogg Model B=MAT)

**Motivation:** Hi vọng ("Chuẩn bị = gia đình sống sót"), Nỗi sợ hợp lý, Xã hội ("Hàng xóm đang chuẩn bị")
**Ability:** Đơn giản hóa (3 phút/bài), miễn phí, ít nỗ lực, thói quen
**Trigger:** Thông báo nhắc nhở, cảnh báo thời tiết thực, streak reminder

---

## Phần VI: Chi tiết Từng Tính năng

### 6.1. Microlearning Modules (8 khóa học × 3-5 bài)

**Khóa 1: Lũ lụt (4 bài)**
- Bài 1: Hiểu về lũ ở Việt Nam (ĐBSCL, Miền Trung, Thành phố)
- Bài 2: Kỹ năng sống sót trong lũ (bơi cứu, tìm nơi cao, sử dụng đồ nổi)
- Bài 3: Chuẩn bị khi có lũ (bộ đồ dùng, kế hoạch gia đình)
- Bài 4: Sau lũ (phục hồi, phòng bệnh, sức khỏe tâm lý)

**Khóa 2: Bão (4 bài)**
- Bài 1: Hiểu về bão ở Việt Nam (các loại bão, cấp bão)
- Bài 2: Chuẩn bị trước bão (72h, 48h, 24h, 12h, 6h, 1h)
- Bài 3: Trong lúc bão (nơi trú an toàn, bảo vệ bản thân)
- Bài 4: Sau bão (kiểm tra, phục hồi, phòng bệnh)

**Khóa 3: Sạt lở đất (3 bài)**
- Bài 1: Dấu hiệu cảnh báo sạt lở
- Bài 2: Quy trình sơ tán
- Bài 3: Kỹ năng sống sót khi bị vùi

**Khóa 4: Động đất & Sóng thần (3 bài)**
- Bài 1: Hiểu về động đất ở Việt Nam
- Bài 2: Kỹ năng sinh tồn (Drop-Cover-Hold)
- Bài 3: Sóng thần: dấu hiệu và cách thoát hiểm

**Khóa 5: Hạn hán (2 bài)**
- Bài 1: Tiết kiệm nước trong mùa hạn
- Bài 2: Bảo vệ hoa màu và sức khỏe

**Khóa 6: Sơ cấp cứu (4 bài)**
- Bài 1: Nguyên tắc sơ cứu, an toàn hiện trường
- Bài 2: Xử lý chảy máu, vết thương, gãy xương
- Bài 3: CPR người lớn, trẻ em, sơ sinh
- Bài 4: Đuối nước, rắn cắn, say nắng

**Khóa 7: Kế hoạch gia đình (3 bài)**
- Bài 1: Bộ đồ dùng 72 giờ
- Bài 2: Kế hoạch liên lạc gia đình
- Bài 3: Giấy tờ quan trọng + vật nuôi

**Khóa 8: Vai trò cộng đồng (2 bài)**
- Bài 1: Trưởng thôn & Ủy ban PCTT
- Bài 2: Đội TNV & Hội Phụ nữ

### 6.2. Interactive Scenarios (3 kịch bản)

**Kịch bản 1: "Bão số 9" (Đà Nẵng)**
```
Bối cảnh: Bạn sống ở Đà Nẵng, bão cấp 4 đang đến
├── Quyết định 1: Ở lại hay sơ tán?
│   ├── Ở lại → Quyết định 2a: Gia cố thế nào?
│   │   ├── Chằng mái → Kết quả: Nhà an toàn
│   │   └── Không gia cố → Kết quả: Mái tốc, nguy hiểm
│   └── Sơ tán → Quyết định 2b: Đi đâu?
│       ├── Trường học → Kết quả: An toàn
│       └── Nhà người thân → Kết quả: Có thể bị kẹt đường
├── Quyết định 3: Giúp hàng xóm lớn tuổi?
│   ├── Giúp → Kết quả: Cả hai an toàn, +200 điểm
│   └── Không giúp → Kết quả: Hàng xóm gặp nguy hiểm
└── Điểm số: Dựa trên tất cả lựa chọn
```

**Kịch bản 2: "Lũ về" (ĐBSCL)**
```
Bối cảnh: Mực nước sông đang dâng nhanh
├── Quyết định 1: Di chuyển đồ đạc lên cao?
├── Quyết định 2: Sơ tán ngay hay chờ?
├── Quyết định 3: Mang theo gì?
└── Kết quả: Dựa trên lựa chọn
```

**Kịch bản 3: "Đất nứt" (Miền núi)**
```
Bối cảnh: Đất trên núi bắt đầu nứt
├── Quyết định 1: Nhận biết dấu hiệu?
├── Quyết định 2: Đường sơ tán?
└── Kết quả: Dựa trên lựa chọn
```

### 6.3. Quiz Engine (SM-2 Adaptive)

**Loại câu hỏi:**
1. Trắc nghiệm: "Đâu là hành động đúng khi gặp lũ?"
2. Đúng/Sai: "Nên bôi kem đánh răng lên vết bỏng"
3. Ghép đôi: Ghép loại thiên tai với hành động phù hợp
4. Kéo thả: Sắp xếp bước sơ cứu theo thứ tự đúng
5. Hình ảnh: "Chọn vị trí an toàn trong hình"

**Spaced Repetition (SM-2):**
- Câu hỏi đúng: Hiện lại sau 1 ngày → 6 ngày → 15 ngày → 30 ngày
- Câu hỏi sai: Hiện lại sau 1 ngày
- Độ khó thích ứng: Đúng 3 câu liên tiếp → Tăng độ khó

### 6.4. First Aid Guide (5 chủ đề)

1. **CPR**: Kiểm tra an toàn → Gọi 115 → Kiểm tra phản ứng → Ép tim 30:2
2. **Cầm máu**: Ép trực tiếp → Nâng cao → Garo (nếu cần)
3. **Bỏng**: Loại bỏ nguồn nhiệt → Nước sạch 15-20 phút → Không bôi gì
4. **Gãy xương**: Bất động → Không cố nắn → Gọi cấp cứu
5. **Đuối nước**: An toàn bản thân → Nem đồ nổi → CPR sau khi đưa ra

### 6.5. Emergency Kit Builder

**Checklist tương tác 4 nhóm:**
- **Nước & Thức ăn**: 9 lít nước, mì gói, bánh quy, sữa hộp
- **Y tế**: Túi sơ cứu, thuốc cá nhân, khẩu trang, găng tay
- **Dụng cụ**: Đèn pin, radio, dao đa năng, dây thừng, còi
- **Giấy tờ**: Bản sao CCCD, bảo hiểm, tiền mặt

### 6.6. Progress Dashboard

**Hiển thị:**
- Bài học đã hoàn thành / Tổng bài học
- Điểm quiz trung bình
- Chuỗi học tập liên tiếp (streak)
- Huy hiệu đã đạt
- Cấp độ hiện tại
- Skill tree theo domain (lũ, bão, sạt lở, sơ cứu...)

---

## Phần VII: File Structure

```
src/
├── app/
│   └── education/
│       └── page.tsx                          # Main education page
├── features/
│   ├── education-survival/
│   │   ├── api/
│   │   │   └── mock-data.ts                  # Course content, quiz, scenarios
│   │   ├── config/
│   │   │   └── education-config.ts           # Colors, labels, quiz configs
│   │   ├── lib/
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   ├── education-context.tsx          # React Context + Reducer
│   │   │   ├── quiz-engine.ts                # SM-2 adaptive quiz
│   │   │   ├── progress-tracker.ts           # Progress + XP + badges
│   │   │   └── use-education-hooks.ts        # Custom hooks
│   │   └── ui/
│   │       ├── EducationHeader.tsx            # Header with view tabs
│   │       ├── CourseBrowser.tsx              # Course list
│   │       ├── LessonViewer.tsx               # Lesson content viewer
│   │       ├── ScenarioSimulator.tsx          # Interactive scenario
│   │       ├── QuizEngine.tsx                 # Quiz component
│   │       ├── FirstAidGuide.tsx              # Step-by-step first aid
│   │       ├── EmergencyKitBuilder.tsx        # Interactive checklist
│   │       ├── EvacuationPlanner.tsx          # Family evacuation plan
│   │       ├── ProgressDashboard.tsx          # Progress + skill tree
│   │       ├── BadgeCollection.tsx            # Badge display
│   │       ├── Leaderboard.tsx                # Ranking
│   │       └── EmergencyNumbers.tsx           # VN emergency contacts
```

---

## Phần VIII: Implementation Plan (18 Tasks, 6 Phases)

### Phase 7A: Foundation (Tasks 1-3)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 1 | `lib/types.ts` | TypeScript interfaces | ~350 |
| 2 | `config/education-config.ts` | Config constants, gamification, quiz | ~250 |
| 3 | `api/mock-data.ts` | 8 khóa học, 3 kịch bản, quiz questions | ~700 |

### Phase 7B: Core Engine (Tasks 4-6)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 4 | `lib/education-context.tsx` | React Context + Reducer + localStorage | ~450 |
| 5 | `lib/quiz-engine.ts` | SM-2 adaptive quiz + spaced repetition | ~350 |
| 6 | `lib/progress-tracker.ts` | XP calculator, badge awarder, level system | ~300 |

### Phase 7C: Learning Components (Tasks 7-10)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 7 | `ui/CourseBrowser.tsx` + `ui/LessonViewer.tsx` | Course list + lesson viewer | ~400 |
| 8 | `ui/ScenarioSimulator.tsx` | Interactive scenario with branching | ~450 |
| 9 | `ui/QuizEngine.tsx` | Quiz with adaptive difficulty | ~350 |
| 10 | `ui/FirstAidGuide.tsx` | Step-by-step first aid (5 topics) | ~350 |

### Phase 7D: Practice Components (Tasks 11-13)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 11 | `ui/EmergencyKitBuilder.tsx` | Interactive checklist | ~280 |
| 12 | `ui/EvacuationPlanner.tsx` | Family evacuation plan builder | ~280 |
| 13 | `ui/EmergencyNumbers.tsx` | VN emergency contacts (112,113,114,115) | ~150 |

### Phase 7E: Progress & Social (Tasks 14-16)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 14 | `ui/ProgressDashboard.tsx` | Progress charts + skill tree | ~350 |
| 15 | `ui/BadgeCollection.tsx` + `ui/Leaderboard.tsx` | Badges + ranking | ~380 |
| 16 | `ui/EducationHeader.tsx` | Header with 6 view tabs | ~220 |

### Phase 7F: Page Assembly (Tasks 17-18)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 17 | `app/education/page.tsx` | Main page (6 views, Provider) | ~550 |
| 18 | Build Verify | `npm run build` + testing | - |

**Total Estimated:** ~5,100+ lines of code

---

## Phần IX: Design Tokens

### Gamification Colors

```
Level 1 (Newcomer):    #94A3B8 (slate-400)
Level 2 (Student):     #3B82F6 (blue)
Level 3 (Member):      #22C55E (green)
Level 4 (Trainer):     #F59E0B (amber)
Level 5 (Expert):      #A855F7 (purple)

Badge Bronze:          #CD7F32
Badge Silver:          #C0C0C0
Badge Gold:            #FFD700

Quiz Correct:          #22C55E (green)
Quiz Wrong:            #EF4444 (red)
Quiz Hint:             #F59E0B (amber)

Progress Fill:         #3B82F6 (blue)
Streak Fire:           #F97316 (orange)
XP Gain:               #A855F7 (purple)
```

### Animation (Framer Motion)

```
Lesson entrance:       0.3s ease, stagger 0.05s
Quiz feedback:         spring, stiffness: 300, damping: 25
Badge unlock:          spring, stiffness: 200, damping: 15 + glow
Progress bar fill:     1s ease-out
Level up celebration:  0.5s scale + confetti
Card hover:            0.2s scale 1.02
XP gain counter:       500ms number roll
Streak fire grow:      400ms scale
Radar chart draw:      1000ms path animation
```

---

## Phần X: Innovation Points

| # | Innovation | Reference | Uniqueness |
|---|-----------|-----------|------------|
| 1 | Microlearning (5 phút/bài) | UNESCO CSS | Lần đầu VN có microlearning PCTT |
| 2 | Interactive Scenarios (3 kịch bản) | Japan Bousai | Mô phỏng tình huống có lựa chọn |
| 3 | SM-2 Adaptive Quiz | SuperMemo | Spaced repetition cho kiến thức PCTT |
| 4 | Octalysis Gamification | Yu-kai Chou | 8 core drives áp dụng cho PCTT |
| 5 | Step-by-step First Aid | IFRC | Hướng dẫn sơ cứu từng bước |
| 6 | Emergency Kit Builder | Ready.gov | Checklist tương tác |
| 7 | Progress Dashboard + Skill Tree | RPG Design | Theo dõi tiến trình như game |
| 8 | Vietnamese Scenarios | Real events | Kịch bản dựa trên Yagi, Damrey |
| 9 | Regional Content | Custom | Nội dung theo vùng miền VN |
| 10 | Behavioral Change Model | Fogg B=MAT | Thiết kế dựa trên khoa học hành vi |
| 11 | Level System (5 levels) | IFRC 3-tier | Từ newbie → expert |
| 12 | 20 Badges + Leaderboard | Ready.gov | Gamification đầy đủ |
| 13 | Emergency Numbers (112,113,114,115) | VN Standard | Danh bạ khẩn cấp VN |
| 14 | Cultural Integration | Custom | Phật giáo, tương thân tương ái |

---

## Phần XI: Scope Boundaries

### INCLUDED
- 6 learning views (Courses, Scenarios, Quizzes, Practice, Community, Info)
- 8 microlearning courses (25 lessons total)
- 3 interactive scenarios
- SM-2 adaptive quiz engine
- First aid guide (5 topics)
- Emergency kit builder
- Evacuation planner
- Emergency numbers
- Progress dashboard + skill tree
- 20 badges + leaderboard
- Vietnamese language
- Dark glassmorphism theme
- localStorage persistence

### EXCLUDED
- Real user authentication
- Real multiplayer features
- Video hosting
- AR/VR features
- Mobile native app
- Teacher admin panel
- Content management system

---

## Phần XII: Execution Order

```
Phase 7A: Task 1 → 2 → 3                      (Foundation)
Phase 7B: Task 4 → 5 → 6                      (Core Engine)
Phase 7C: Task 7 → 8 → 9 → 10                 (Learning Components)
Phase 7D: Task 11 → 12 → 13                    (Practice Components)
Phase 7E: Task 14 → 15 → 16                    (Progress & Social)
Phase 7F: Task 17 → 18                         (Page Assembly + Verify)
```

---

## Phần XIII: Verification Checklist

### Build & Runtime
- [ ] `npm run build` - zero errors
- [ ] `npm run dev` - http://localhost:3000/education loads
- [ ] All 6 views navigate correctly

### Learning Features
- [ ] Course browser displays 8 courses
- [ ] Lesson viewer shows content with progress
- [ ] Scenario simulator branching works
- [ ] Quiz adaptive difficulty adjusts
- [ ] Spaced repetition schedules correctly

### Practice Features
- [ ] First aid guide shows step-by-step
- [ ] Emergency kit builder tracks completion
- [ ] Evacuation planner generates plans
- [ ] Emergency numbers display correctly

### Gamification
- [ ] Points awarded correctly (XP, coins)
- [ ] 20 badges unlock on achievement
- [ ] Leaderboard displays rankings
- [ ] Level progression works (5 levels)
- [ ] Streak tracking works

### Quality
- [ ] Mobile responsive (375px)
- [ ] Vietnamese labels correct
- [ ] Offline persistence works
- [ ] Performance: page load < 2s

---

## Phần XIV: Tổng kết

Phase 7 - Module Giáo Dục & Nhận Thức là module **con người** của CứuNet:
- **14 tính năng**, **18 tasks**, **6 sub-phases**
- **5,100+ lines** of code
- **14 innovation points** cho thesis
- Tham khảo **8 chuẩn/quốc gia** (UNESCO, UNICEF, IFRC, Japan Bousai, Philippines CBDRM, FEMA Ready.gov, Octalysis, SM-2)
- Dựa trên **dữ liệu thực** Việt Nam (Yagi 2024, Damrey 2017, lũ 2020, Huế 1999)

**Sau Phase 7, CứuNet sẽ là:**
```
Map → Predict → Report → Alert → Rescue → Dashboard → Education = COMPLETE SYSTEM
(Bản đồ) (AI)    (Cộng đồng) (Cảnh báo) (Cứu hộ) (Trực quan) (Giáo dục) = HỆ THỐNG HOÀN CHỈNH
```

**So sánh với hệ thống quốc tế:**
| Tính năng | Ready.gov | Japan Bousai | UNICEF | CứuNet Phase 7 |
|-----------|-----------|-------------|--------|----------------|
| Microlearning | ❌ | ✅ | ✅ | ✅ 5 phút/bài |
| Interactive Scenarios | ❌ | ✅ | ❌ | ✅ 3 kịch bản |
| SM-2 Adaptive Quiz | ❌ | ❌ | ❌ | ✅ Spaced repetition |
| Octalysis Gamification | ✅ | ✅ | ❌ | ✅ 8 core drives |
| First Aid Guide | ✅ | ✅ | ✅ | ✅ Step-by-step |
| Emergency Kit Builder | ✅ | ❌ | ❌ | ✅ Interactive |
| Skill Tree | ❌ | ❌ | ❌ | ✅ RPG-style |
| 20 Badges | ❌ | ❌ | ❌ | ✅ Full system |
| Vietnamese Language | ❌ | ❌ | ❌ | ✅ Native |
| Dark Theme | ❌ | ❌ | ❌ | ✅ Glassmorphism |
| Offline | ❌ | ❌ | ❌ | ✅ localStorage |
