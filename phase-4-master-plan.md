# MASTER PLAN: Phase 4 - Module Cảnh Báo & SOS Thiên Tai

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1 (Bản đồ), Phase 2 (AI Dự đoán), Phase 3 (Báo cáo Cộng đồng) đã hoàn thành/planned. Bây giờ chuyển sang **Phase 4: Module Cảnh Báo & SOS** - module cứu sống người trực tiếp.

**Tại sao module này là "life-saver" của luận văn:**
- Kết nối trực tiếp với Phase 2 (AI Dự đoán) → dự đoán → cảnh báo → hành động
- Giải quyết pain point lớn nhất của VN: không có app cảnh báo thống nhất
- SOS 1 chạm + offline queueing = cứu người khi mạng sập
- Checklist theo mùa = phòng ngừa trước thiên tai
- Hội đồng: "Hệ thống không chỉ dự đoán mà còn CẢNH BÁO và HỖ TRỢ người dân"

---

## Phần I: Phân tích Vấn đề - Thiên tai Việt Nam

### 1.1. Thiên tai tại Việt Nam - Con số biết nói

Việt Nam nằm trong **TOP 5 quốc gia bị thiên tai nặng nhất thế giới** (UNDRR). Trung bình mỗi năm, thiên tai gây thiệt hại **1-2% GDP** (~$2-3.5 tỷ USD).

#### Các sự kiện thiên tai lớn gần đây:

| Sự kiện | Thương vong | Thiệt hại kinh tế | Người ảnh hưởng |
|---------|------------|-------------------|----------------|
| **Bão Yagi 2024** | 325 chết, 1,987 bị thương | 84.5 nghìn tỷ (~$3.47B) | 5.7 triệu mất điện |
| **Bão Damrey 2017** | 107 chết, 342 bị thương | ~22 nghìn tỷ (~$1 tỷ) | 4 triệu người |
| **Lũ miền Trung 2020** | 200+ chết | Hàng trăm nghìn tỷ | Hàng triệu người |

#### Phân bổ theo vùng:

- **Miền Trung** (Quảng Bình → Khánh Hòa): Bão, lũ lụt, sạt lở. Tần suất cao nhất (tháng 9-11)
- **Miền Bắc** (Lào Cai, Yên Bái, Quảng Ninh): Lũ quét, sạt lở đất (tháng 6-9)
- **Đồng bằng sông Cửu Long** (An Giang, Cần Thơ, Bến Tre): Ngập mặn, hạn hán (tháng 12-4)

#### Nguồn tham khảo:
- Wikipedia - Typhoon Yagi (2024), Typhoon Damrey (2017)
- World Bank Vietnam Overview, EM-DAT International Disaster Database
- ReliefWeb (UN OCHA), UNDRR

### 1.2. Hệ thống cảnh báo hiện tại của Việt Nam - Khoảng cách và hạn chế

#### Cơ cấu tổ chức:
- **VNDMA** (Vietnam Disaster Management Authority) thuộc Bộ Nông nghiệp
- 4 cấp: Trung ương → Tỉnh → Huyện → Xạ
- Ủy ban PCTT cấp xã thiếu nhân lực và ngân sách

#### Công nghệ cảnh báo hiện tại:

| Kênh | Hiệu quả | Hạn chế |
|------|----------|---------|
| Truyền hình/Đài phát thanh | Trung bình | Chỉ hiệu quả ở thành thị có TV |
| Loa phát thanh xã | Kém | Cổ kỹ, không đồng bộ, chỉ ban ngày |
| SMS | Kém | Quá tải khi thiên tai, không geo-targeted |
| Radio | Trung bình | Không đồng bộ, vùng núi vẫn hữu dụng |
| Facebook/Zalo | Cao | Không chính thức, dễ lan tin giả |

#### Khoảng cách đã được tài liệu hóa:

**Vùng nông thôn và dân tộc thiểu số:**
- Nhiều cộng đồng vùng cao không hiểu cảnh báo bằng tiếng Việt
- Tỷ lệ biết chữ thấp làm giảm hiệu quả cảnh báo viết
- Hạ tầng truyền thông kém (không sóng điện thoại, không điện)

**Thời gian truyền tải:**
- Từ lúc có cảnh báo cấp quốc gia → người dân nhận được: nhiều giờ, thậm chí cả ngày ở vùng sâu
- Cảnh báo qua loa chỉ đạt hiệu quả ban ngày và trong tầm nghe

**Thất bại cụ thể:**
- Bão Yagi 2024: Nhiều cộng đồng vùng núi bị lở đất bất ngờ dù cảnh báo đã phát
- Lũ miền Trung 2020: Nhiều vụ lở đất xảy ra ban đêm, cảnh báo không đến đúng lúc

**Nguồn tham khảo:** UNDRR, World Bank, IFRC, ADRC

### 1.3. Khoảng cách CuuNet có thể lấp đầy

| Khoảng cách | Giải pháp CuuNet |
|-------------|-----------------|
| Không có app cảnh báo thống nhất | Module Cảnh báo & SOS |
| Không geo-targeted | Turf.js point-in-polygon |
| Không offline capability | IndexedDB + Background Sync |
| Không có SOS GPS | SOS 1 chạm với GPS auto-capture |
| Không có checklist chuẩn bị | Seasonal Preparedness Checklist |
| Không có danh sách khẩn cấp theo tỉnh | Emergency Directory |
| Cảnh báo không đến kịp | Multi-channel delivery + escalation |

---

## Phần II: Nghiên cứu Quốc tế - Hệ thống Cảnh báo Toàn cầu

### 2.1. Các chuẩn quốc tế

#### CAP (Common Alerting Protocol) - OASIS Standard

**Phiên bản:** CAP v1.2 (7/2010)

**Tại sao CAP quan trọng:**
- Cho phép MỘT tin nhắn cảnh báo được phát đồng thời qua nhiều hệ thống
- Hỗ trợ đa ngôn ngữ, đa đối tượng
- Hỗ trợ mã hóa và chữ ký số
- Tương thích ngược với các định dạng cũ (SAME, NOAA)

**Cấu trúc CAP:**
```
<alert>
  <identifier>ID duy nhất</identifier>
  <sender>Cơ quan gửi</sender>
  <sent>Thời gian gửi</sent>
  <status>Actual/Exercise/System/Test/Draft</status>
  <msgType>Alert/Update/Cancel/Ack/Error</msgType>
  <scope>Public/Restricted/Private</scope>
  <info>
    <category>Geo/Met/Safety/Security...</category>
    <event>Mô tả sự kiện</event>
    <urgency>Immediate/Expected/Future/Past</urgency>
    <severity>Extreme/Severe/Moderate/Minor</severity>
    <certainty>Observed/Likely/Possible/Unlikely</certainty>
    <area>
      <circle>Kinh độ, vĩ độ, bán kính</circle>
      <polygon>Tọa độ đa giác</polygon>
    </area>
  </info>
</alert>
```

**Quốc gia sử dụng CAP:**
- Mỹ: FEMA IPAWS (từ 2010)
- Canada: CAP-CP, Alert Ready (2015)
- Úc: CAP-AU-STD (2012)
- Đức: MoWaS
- Nhật: J-Alert (satellite-based)
- Sri Lanka: Hệ thống CAP sau sóng thần 2004

**Nguồn:** OASIS CAP Technical Committee, docs.oasis-open.org/emergency/cap/v1.2/

#### IPAWS (Integrated Public Alert and Warning System)

**Kiến trúc 4 thành phần:**
1. **EAS (Emergency Alert System):** Cảnh báo qua TV và radio
2. **NAWAS (National Warning System):** Truyền thông giữa các cơ quan chính phủ
3. **WEA (Wireless Emergency Alerts):** Cảnh báo qua điện thoại di động (Cell Broadcast)
4. **NOAA Weather Radio:** Radio thời tiết chuyên dụng

**Bối cảnh ra đời:** Sau thảm Katrina 2005, TT Bush ký Executive Order 13407 (6/2006)

**Nguồn:** FEMA IPAWS

#### 3GPP Cell Broadcast

**Nguyên lý:** Hệ thống **một-nhiều** (one-to-many), khác SMS (một-một)
- Gửi tin nhắn đến tất cả thiết bị kết nối với các ô sóng cụ thể
- Không cần biết số điện thoại cá nhân - GDPR compliant
- Không bị ảnh hưởng bởi nút mạng

**Thông số kỹ thuật:**
- Mỗi trang: 82 octet, tối đa 93 ký tự
- Tối đa 15 trang = 1,395 ký tự
- CBS mới nhất: gửi đến 1,000,000 ô sóng trong dưới 10 giây
- Hoạt động ngay cả khi không có SIM

**Nguồn:** 3GPP Technical Specifications

#### Khung Sendai (2015-2030)

**4 ưu tiên hành động:**
1. Hiểu biết nguy cơ thiên tai
2. Tăng cường quản lý nguy cơ
3. Đầu tư vào giảm nguy cơ
4. Tăng cường sẵn sàng đối phó

**Mục tiêu 7 (liên quan trực tiếp):** Tăng khả dụng của hệ thống cảnh báo sớm đa nguy cơ

**Cam kết của Việt Nam:**
- Luật Phòng, chống thiên tai 2013
- Chiến lược Phòng, chống thiên tai 2021-2030
- SDG Indicator 13.1.2

**Nguồn:** UNDRR, Wikipedia - Sendai Framework

### 2.2. Hệ thống tương tự quốc tế - So sánh và học hỏi

#### Project NOAH (Philippines)
- **Cơ quan:** DOST (Bộ Khoa học Philippines)
- **Chức năng:** Giám sát thời tiết, bản đồ ngập lụt, bản đồ nguy cơ lở đất, hiển thị sóng bão
- **Bài học:** Tích hợp dữ liệu thời tiết thời gian thực + bản đồ nguy cơ + cảnh báo theo vị trí

#### Bangladesh - Cyclone Preparedness Programme (Câu chuyện thành công toàn cầu)
- **Quy mô:** 76,000+ tình nguyện viên cấp cộng đồng
- **Phương tiện:** Loa tay, còi tay, cảnh báo đến từng nhà
- **Kết quả:** Bão Bhola 1970: 300,000-500,000 chết → Bão Sidr 2007 (cùng cấp mạnh): chỉ 3,400-4,200 chết
- **Giảm 98% số người chết** nhờ hệ thống cảnh báo và cộng đồng
- **Bài học:** Tình nguyện viên cấp cộng đồng là then chốt; công nghệ không đủ, cần sự tin tưởng

#### InaTEWS (Indonesia)
- **Cơ quan:** BMKG
- **Kiến trúc:** Mạng cảm biến địa chấn, trạm GPS, phao đại dương, trạm đo mực nước
- **Thời gian:** Cảnh báo sóng thần trong vòng vài phút
- **Bài học:** Đa kênh phát cảnh báo, tích hợp cảm biến thời gian thực

#### Yurekuru Call (Nhật Bản)
- **Chức năng:** Cảnh báo động đất thời gian thực từ JMA
- **Đặc biệt:** Gửi thông báo từ vài giây đến vài phút trước khi rung chấn đến
- **Bài học:** Cảnh báo nhanh theo vị trí, tích hợp dữ liệu chính thức

### 2.3. Innovation Opportunities - Điểm mới cho luận văn

#### AI-powered Alert Relevance (Giảm alert fatigue)
- **Vấn đề:** "Alert fatigue" - khi cảnh báo quá nhiều và không liên quan, người dân bỏ qua
- **Giải pháp AI:**
  - Bộ lọc liên quan: ML xác định cảnh báo nào liên quan đến người dùng cụ thể
  - Giảm cảnh báo giả: ML phân loại mức độ nghiêm trọng
  - Cảnh báo thích ứng: Điều chỉnh nội dung theo phản hồi người dùng

#### Offline-first SOS System
- **Vấn đề:** Khi thiên tai xảy ra, mạng di động thường bị đứt
- **Công nghệ:**
  - IndexedDB lưu trữ SOS locally
  - Background Sync API flush queue khi có mạng
  - Mesh networking (BLE, Wi-Fi Direct) - tham khảo GoTenna, Bridgefy
  - CRDTs cho đồng bộ dữ liệu khi kết nối phục hồi

#### Multi-channel Delivery
- Nghiên cứu cho thấy hệ thống hiệu quả nhất kết hợp:
  - Cell Broadcast (không cần app)
  - App mobile (chi tiết, đa phương tiện)
  - Loa phát thanh (nông thôn)
  - TV/Radio (phổ biến)
  - SMS (backup)
  - Mạng xã hội (lan truyền nhanh)

#### What3Words trong cứu hộ
- Chia mặt đất thành 57 nghìn tỷ ô 3x3m, mỗi ô có 3 từ duy nhất
- 85% dịch vụ cứu hộ khẩn cấp Anh sử dụng
- Ứng dụng: Hướng dẫn vị trí chính xác khi không có địa chỉ

---

## Phần III: Thiết kế Module - Cảnh Báo & SOS

### 3.1. Tổng quan tính năng

Module này gồm **4 nhóm tính năng chính**:

#### Nhóm 1: Hệ thống Cảnh báo (Alert System)
1. **Geo-targeted Alert** - Cảnh báo theo vị trí người dùng, CAP-inspired
2. **Multi-channel Delivery** - App push + SMS fallback + Zalo OA
3. **AI Relevance Filtering** - Chỉ gửi cảnh báo liên quan
4. **Alert Escalation** - Tự tăng kênh nếu không xác nhận

#### Nhóm 2: Hệ thống SOS
5. **SOS 1 Chạm** - One-tap, GPS auto-capture, offline queueing
6. **Offline SOS Queue** - IndexedDB + Background Sync

#### Nhóm 3: Hỗ trợ Khẩn cấp
7. **Emergency Directory** - Danh sách khẩn cấp theo tỉnh
8. **Seasonal Preparedness Checklist** - Checklist theo mùa + khu vực

#### Nhóm 4: Trải nghiệm Người dùng
9. **Alert Feed** - Timeline cảnh báo
10. **SOS History** - Lịch sử SOS cá nhân

### 3.2. Kiến trúc Tổng quan

```
┌──────────────────────────────────────────────────────────────────┐
│                       ALERT & SOS PAGE                            │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ AlertStats  │ │  AlertMap   │ │  SOSPanel   │ │ Emergency  │ │
│  │    Bar      │ │  (Leaflet)  │ │  (1-tap)    │ │ Directory  │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │
│         └────────────────┴───────────────┴──────────────┘        │
│                                │                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  AlertFeed  │ │ AlertDetail │ │ Checklist   │ │ SOSHistory │ │
│  │  (Timeline) │ │  Modal      │ │  Manager    │ │  Panel     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                │                                  │
│                    ┌───────────┴───────────┐                     │
│                    │  Alert & SOS Context   │                     │
│                    │  (React Context)       │                     │
│                    └───────────┬───────────┘                     │
│                                │                                  │
│         ┌──────────────────────┼──────────────────────┐          │
│         │                      │                      │          │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌──────┴──────┐  │
│  │ Alert       │    │   SOS Engine        │   │ Notification│  │
│  │ Engine      │    │   (Offline-first)   │   │ Delivery    │  │
│  └──────┬──────┘    └──────────┬──────────┘   └──────┬──────┘  │
│         │                      │                      │          │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌──────┴──────┐  │
│  │ Geo-target  │    │   IndexedDB Queue   │   │  Web Push   │  │
│  │ + CAP       │    │   + Background Sync │   │  + SMS      │  │
│  └─────────────┘    └─────────────────────┘   └─────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3. Thiết kế Chi tiết Tính năng

#### Tính năng 1: Geo-targeted Alert System

**Mục tiêu:** Cảnh báo chỉ đến người dùng trong vùng bị ảnh hưởng

**Cơ chế:**
- Cảnh báo có chứa vùng địa lý (polygon hoặc circle)
- Khi nhận cảnh báo, kiểm tra vị trí người dùng có nằm trong vùng đó không
- Sử dụng Turf.js (point-in-polygon) cho kiểm tra client-side
- Nếu trong vùng → hiển thị cảnh báo. Ngoài vùng → bỏ qua

**Inspired từ:**
- FEMA WEA: geo-targeting ~300m radius
- J-Alert: satellite → cell broadcast → devices

**Mức độ nghiêm trọng (theo CAP):**
- **Extreme (Cực kỳ nghiêm trọng):** Đỏ đậm, âm thanh, rung, không thể bỏ qua dễ dàng
- **Severe (Nghiêm trọng):** Cam, âm thanh, rung
- **Moderate (Trung bình):** Vàng, không âm thanh
- **Minor (Nhẹ):** Xanh lá, im lặng

**Dữ liệu cảnh báo mẫu:**
- "CẢNH BÁO KHẨN CẤP: Bão số 5 đổ bộ Đà Nẵng - Quảng Nam"
- "Lũ lụt nghiêm trọng tại Quảng Bình - Mưa 300mm/24h"
- "Sạt lở đất tại Lào Cai - Di chuyển ngay khỏi khu vực sườn đồi"

#### Tính năng 2: Multi-channel Delivery

**Kênh phát cảnh báo:**

| Kênh | Ưu điểm | Hạn chế | Vai trò trong CuuNet |
|------|---------|---------|---------------------|
| App Push | Chi tiết, đa phương tiện | Cần cài app | Kênh chính |
| SMS | Không cần app, không cần internet | Ký tự hạn chế | Fallback khi push fail |
| Zalo OA | Phổ biến ở VN, low-bandwidth | Cần follow OA | Kênh bổ sung |
| Loudspeaker | Phổ biến ở nông thôn | Cần IoT gateway | Mock cho thesis |

**Escalation Chain:**
```
Push (ngay) → SMS (sau 2 phút nếu không ack) → Zalo (sau 5 phút) → Loudspeaker (sau 10 phút)
```

**Cho thesis:** Mock SMS và Zalo, chỉ thực sự gửi Push notification

#### Tính năng 3: AI Relevance Filtering

**Bài toán:** Giảm "alert fatigue" - chỉ gửi cảnh báo thực sự liên quan

**Thuật toán tính điểm liên quan (0-100):**

| Factor | Trọng số | Cách tính |
|--------|----------|-----------|
| Khoảng cách đến vùng cảnh báo | 40% | Trong vùng = 40, <20km = 30, <50km = 15, <100km = 5 |
| Mức độ nghiêm trọng | 25% | Extreme = 25, Severe = 19, Moderate = 13, Minor = 6 |
| Tính dễ bị tổn thương | 20% | Người già, trẻ em, gần biển, vùng trũng → điểm cao hơn |
| Loại thiên tai đăng ký | 10% | Người dùng chọn nhận cảnh báo lũ/bão/sạt lở |
| Thời gian hiệu lực | 5% | Sắp xảy ra = 5, trong 6h = 3, trong 24h = 1 |

**Ngưỡng gửi:**
- Extreme: Luôn gửi (ngưỡng 20)
- Severe: Gửi nếu ≥ 40
- Moderate: Gửi nếu ≥ 60
- Minor: Gửi nếu ≥ 80

**Deduplication:** Gom nhóm cảnh báo giống nhau (cùng sự kiện + vùng + mức độ), chỉ giữ cái mới nhất

#### Tính năng 4: Alert Escalation Engine

**Bài toán:** Nếu người dùng không xác nhận cảnh báo, tự động tăng kênh

**Quy tắc theo mức độ:**

| Severity | Bước 1 | Bước 2 | Bước 3 | Bước 4 |
|----------|--------|--------|--------|--------|
| Extreme | Push (ngay) | SMS (2 phút) | Zalo (5 phút) | Loudspeaker (10 phút) |
| Severe | Push (ngay) | SMS (10 phút) | Zalo (30 phút) | - |
| Moderate | Push (ngay) | SMS (60 phút) | - | - |
| Minor | Push (ngay) | - | - | - |

#### Tính năng 5: SOS 1 Chạm

**Luồng hoạt động:**
```
Nhấn SOS → GPS auto-capture → Chọn tình huống → Xác nhận → Gửi
                                                    ↓
                                          Nếu offline → Lưu vào IndexedDB
                                                    ↓
                                          Khi có mạng → Tự động gửi lại
```

**Tình huống SOS (8 loại):**
- 🌊 Lũ lụt | 🌪️ Bão | ⛰️ Sạt lở | 🏚️ Động đất
- 🔥 Cháy | 🏥 Cấp cứu | 🪢 Mắc kẹt | 🚤 Cần cứu hộ

**Mức độ khẩn cấp:**
- **Life-threatening (Nguy hiểm tính mạng):** Điểm ưu tiên cao nhất
- **Urgent (Gấp):** Điểm ưu tiên cao
- **Need help (Cần giúp đỡ):** Điểm ưu tiên trung bình

**Tính năng đặc biệt:**
- GPS accuracy indicator (hiển thị ±xx mét)
- People count selector (1-10+)
- Optional text description
- Offline indicator: "Không có mạng - SOS sẽ gửi khi có mạng lại"
- Status tracking: Sent → Delivered → Dispatched → Resolved

#### Tính năng 6: Offline SOS Queue

**Bài toán:** Khi thiên tai xảy ra, mạng bị đứt. SOS phải gửi được dù không có mạng.

**Cơ chế:**
1. Kiểm tra `navigator.onLine`
2. Nếu offline → lưu SOS vào IndexedDB
3. Đăng ký Background Sync (Chrome)
4. Lắng nghe sự kiện `online` (tất cả trình duyệt)
5. Khi có mạng → flush queue, gửi tất cả SOS đã lưu

**Fallback cho Safari (không có Background Sync):**
- Polling mỗi 30 giây kiểm tra kết nối
- Khi online → flush queue

**Retry logic:**
- Tối đa 10 lần retry
- Exponential backoff: 1s, 2s, 4s, 8s...
- Nếu 10 lần fail → đánh dấu "failed", thông báo người dùng

#### Tính năng 7: Emergency Directory

**Dữ liệu:**

| Loại | Số điện thoại | Mô tả |
|------|-------------|-------|
| Cảnh sát | 113 | An ninh trật tự |
| Cứu hỏa | 114 | Cứu hỏa, cứu nạn |
| Cấp cứu | 115 | Cấp cứu y tế |
| Biên phòng | 116 | Cứu hộ biển, biên phòng |

**Danh sách theo tỉnh:** Mỗi tỉnh có thêm:
- Ban PCTT tỉnh (số điện thoại trực ban)
- Đội cứu nạn chuyên nghiệp
- Hội Chữ thập đỏ tỉnh
- Bệnh viện gần nhất

**Tính năng:**
- Province selector dropdown
- "Gọi ngay" button (tap to call)
- 24/7 badge
- Search by name
- Favorite/bookmark

#### Tính năng 8: Seasonal Preparedness Checklist

**Cấu trúc checklist (6 nhóm):**

| Nhóm | Số mục | Ví dụ |
|------|--------|-------|
| Vật tư (Supplies) | 6 | Nước uống, thực phẩm khô, đèn pin, bộ sơ cứu, áo phao, dây thừng |
| Giấy tờ (Documents) | 2 | CCCD/hộ khẩu bản sao, tiền mặt dự phòng |
| Nhà cửa (Home) | 3 | Gia cố nhà, nâng đồ lên cao, bao cát |
| Liên lạc (Communication) | 3 | Sạc đầy pin, radio, danh bạ khẩn cấp |
| Sơ tán (Evacuation) | 2 | Xác định đường sơ tán, túi đồ sơ tán |
| Sức khỏe (Health) | 2 | Thuốc cá nhân, xử lý nước sạch |

**Tổng: 18 mục thiết yếu**

**Lọc theo mùa và khu vực:**
- Miền Nam: Mưa bão tháng 5-10
- Miền Trung: Tháng 8-11 (bão mạnh nhất)
- Miền Bắc: Tháng 6-9 (lũ), tháng 8-10 (bão)
- Vùng ven biển: Thêm áo phao, phao cứu sinh
- Vùng ngập: Thêm bao cát, xử lý nước sạch

**Tính năng:**
- Checkbox đánh dấu hoàn thành
- Progress gauge (% hoàn thành)
- Printable version (window.print())
- Share checklist qua Zalo/SMS
- Season indicator: "Checklist mùa mưa bão (Tháng 5-10)"

---

## Phần IV: Mô hình Dữ liệu

### 4.1. Alert Model (CAP-Inspired)

```
Alert
├── id: string
├── identifier: string (CAP unique ID)
├── sender: string ("vndma" | "cnet-ai" | "community")
├── sent: ISO timestamp
├── status: "actual" | "exercise" | "test"
├── msgType: "alert" | "update" | "cancel"
├── scope: "public" | "restricted" | "private"
├── info
│   ├── language: "vi" | "en"
│   ├── category: "geo" | "met" | "safety" | "rescue"
│   ├── event: string ("Lũ lụt", "Bão cấp 12")
│   ├── responseType: "shelter" | "evacuate" | "prepare" | "avoid"
│   ├── urgency: "immediate" | "expected" | "future"
│   ├── severity: "extreme" | "severe" | "moderate" | "minor"
│   ├── certainty: "observed" | "likely" | "possible"
│   ├── headline: string
│   ├── description: string
│   ├── instruction: string
│   ├── area
│   │   ├── areaDesc: string
│   │   ├── polygon: GeoJSON
│   │   └── geocode: Record<string, string>
│   ├── effective: ISO timestamp
│   └── expires: ISO timestamp
└── delivery
    ├── channels: DeliveryChannel[]
    ├── deliveredCount: number
    └── acknowledgedCount: number
```

### 4.2. SOS Request Model

```
SOSRequest
├── id: string
├── userId: string
├── location
│   ├── lat: number
│   ├── lng: number
│   ├── accuracy: number (GPS accuracy in meters)
│   └── what3words?: string
├── situation
│   ├── type: "flood" | "storm" | "landslide" | "earthquake" | "tsunami" | "fire" | "medical" | "trapped" | "stranded" | "other"
│   ├── severity: "life_threatening" | "urgent" | "need_help"
│   ├── peopleCount: number
│   ├── description?: string
│   └── photos?: string[]
├── contact
│   ├── name?: string
│   ├── phone?: string
│   └── alternatePhone?: string
├── status: "queued" | "sent" | "delivered" | "acknowledged" | "dispatched" | "resolved"
├── createdAt: ISO timestamp
├── sentAt?: ISO timestamp
├── acknowledgedAt?: ISO timestamp
├── dispatchedAt?: ISO timestamp
├── resolvedAt?: ISO timestamp
├── isOffline: boolean
└── retryCount: number
```

### 4.3. Checklist Model

```
ChecklistItem
├── id: string
├── category: "supplies" | "documents" | "home" | "communication" | "evacuation" | "health"
├── title: string
├── description: string
├── priority: "essential" | "recommended" | "optional"
├── icon: string
├── disasterTypes: DisasterType[]
├── regions: string[] ("all" | "coastal" | "flood_prone" | "mountainous")
└── season: "all" | "monsoon" | "dry" | "typhoon"
```

### 4.4. Emergency Contact Model

```
EmergencyContact
├── id: string
├── name: string
├── nameVi: string
├── number: string
├── type: "police" | "fire" | "ambulance" | "coast_guard" | "disaster" | "rescue" | "military" | "red_cross"
├── icon: string
├── color: string
├── available24_7: boolean
└── description: string
```

---

## Phần V: Giao diện Người dùng

### 5.1. Tổng quan Layout

**Trang chính:** `/alert`

**Tab-based navigation:**
1. **Dashboard** - Tổng quan: AlertMap + SOSPanel + AlertFeed
2. **SOS** - Gửi SOS + lịch sử
3. **Cảnh báo** - AlertFeed + filters
4. **Khẩn cấp** - Emergency Directory
5. **Checklist** - Seasonal Preparedness

**Mobile:** Bottom tab bar thay vì sidebar tabs

### 5.2. Thiết kế Từng Component

#### AlertStatsBar - Thống kê Dashboard
- 5 thẻ thống kê glass morphism:
  1. Cảnh báo đang hoạt động
  2. Cảnh báo cực kỳ nghiêm trọng
  3. SOS chờ xử lý
  4. SOS đã giải quyết (hôm nay)
  5. Checklist hoàn thành (%)
- Animated counters (reuse pattern từ Phase 1, 3)

#### AlertMap - Bản đồ Cảnh báo
- MapContainer + TileLayer (reuse từ Phase 1)
- Vùng cảnh báo polygons (màu theo mức độ)
- Vị trí người dùng (chấm xanh nhấp nháy)
- SOS markers (đỏ nhấp nháy)
- Layer toggle: Alert zones, SOS, Emergency facilities

#### SOSPanel - SOS 1 Chạm
- Nút SOS lớn (32px+ đường kính, nhấp nháy)
- Chọn tình huống (8 loại với icon)
- GPS accuracy indicator
- People count selector
- Confirmation screen → "GỬI SOS"
- Status tracking: Sent → Delivered → Dispatched → Resolved

#### AlertFeed - Timeline Cảnh báo
- Danh sách cảnh báo theo thời gian
- Mỗi thẻ: icon mức độ + tiêu đề + loại + thời gian
- Filter: severity, type
- Click → AlertDetailModal

#### AlertDetailModal - Chi tiết Cảnh báo
- Banner mức độ (full-width, màu sắc)
- Tiêu đề + mô tả + hướng dẫn
- Vùng ảnh hưởng (mini map)
- Thời gian hiệu lực
- Nguồn + link
- Nút: "Xác nhận" / "Bỏ qua" / "Chia sẻ"

#### EmergencyDirectory - Danh bạ Khẩn cấp
- Province selector
- Thẻ liên hệ: icon + tên + số điện thoại + "Gọi ngay"
- 24/7 badge
- Quốc gia trước, tỉnh sau

#### ChecklistManager - Checklist Chuẩn bị
- Progress gauge (SVG circular)
- 6 nhóm với checkbox
- Priority badge (essential/recommended/optional)
- Season indicator
- Printable version

#### SOSHistoryPanel - Lịch sử SOS
- Danh sách SOS đã gửi
- Status badges
- Thống kê: tổng gửi, thời gian phản hồi TB

---

## Phần VI: Chiến lược Mock Data

### 6.1. Cảnh báo mẫu (20 alerts)

| ID | Sự kiện | Mức độ | Vùng | Thời gian |
|----|---------|--------|------|-----------|
| ALT-001 | Bão số 5 đổ bộ | Extreme | Đà Nẵng, Quảng Nam | 2024-10-15 |
| ALT-002 | Lũ lụt nghiêm trọng | Extreme | Quảng Bình | 2024-10-15 |
| ALT-003 | Sạt lở đất | Severe | Lào Cai | 2024-10-14 |
| ALT-004 | Mưa lớn cảnh báo | Moderate | Huế | 2024-10-14 |
| ALT-005 | Hạn hán nghiêm trọng | Severe | Cần Thơ, An Giang | 2024-03-15 |
| ... | ... | ... | ... | ... |

### 6.2. SOS mẫu (30 requests)

- Phân bổ đều 15 tỉnh
- 8 loại tình huống
- 3 mức độ khẩn cấp
- Các trạng thái khác nhau (queued, sent, delivered, dispatched, resolved)

### 6.3. Liên hệ khẩn cấp

- 4 số quốc gia (113, 114, 115, 116)
- Mỗi tỉnh: 3-5 liên hệ bổ sung (Ban PCTT, cứu nạn, chữ thập đỏ)

### 6.4. Checklist mẫu

- 18 mục cơ bản
- Random completion states cho demo

---

## Phần VII: Dependencies

### Cần cài mới:
```
npm install workbox-background-sync  (optional, có thể implement thủ công)
```

### Đã có (reuse):
- Leaflet + react-leaflet (Phase 1)
- Framer Motion (Phase 1)
- Recharts (Phase 1)
- lucide-react (Phase 1)
- Turf.js (Phase 2 plan)

### Browser APIs (không cần npm):
- Web Push API (native)
- IndexedDB (native)
- Background Sync API (Chrome)
- Geolocation API (native)

---

## Phần VIII: Implementation Plan (20 Tasks)

### Phase 4A: Foundation & Data Layer (Tasks 1-5)

| Task | Mô tả | File | Output |
|------|-------|------|--------|
| 1 | TypeScript Types | `lib/types.ts` | Alert, SOS, Checklist, EmergencyContact, State, Action |
| 2 | Config | `config/alert-config.ts` | Severity, SOS type, escalation rules, relevance thresholds |
| 3 | Mock Data | `api/mock-data.ts` | 20 alerts, 30 SOS, 15 provinces contacts, 18 checklist items |
| 4 | Dependencies | npm install | workbox-background-sync (optional) |
| 5 | Context | `lib/alert-sos-context.tsx` | Provider, reducer, localStorage, IndexedDB, offline detection |

### Phase 4B: Core Engines (Tasks 6-11)

| Task | Mô tả | File | Output |
|------|-------|------|--------|
| 6 | Relevance Engine | `lib/relevance-engine.ts` | 5-factor scoring, deduplication, geo-check |
| 7 | Escalation Engine | `lib/escalation-engine.ts` | Time-based channel escalation |
| 8 | Offline Queue | `lib/offline-queue.ts` | IndexedDB + Background Sync + retry |
| 9 | Emergency Directory | `lib/emergency-directory.ts` | National + provincial contacts |
| 10 | Checklist Data | `lib/checklist-data.ts` | 18 items, seasonal/region filtering |
| 11 | Hooks | `lib/use-alert-hooks.ts` | useAlerts, useSOS, useDirectory, useChecklist, useGeolocation |

### Phase 4C: UI - Stats & Map (Tasks 12-13)

| Task | Mô tả | File |
|------|-------|------|
| 12 | AlertStatsBar | `ui/AlertStatsBar.tsx` |
| 13 | AlertMap | `ui/AlertMap.tsx` |

### Phase 4D: UI - SOS & Alert (Tasks 14-15)

| Task | Mô tả | File |
|------|-------|------|
| 14 | SOSPanel | `ui/SOSPanel.tsx` |
| 15 | AlertFeed + AlertDetailModal | `ui/AlertFeed.tsx`, `ui/AlertDetailModal.tsx` |

### Phase 4E: UI - Directory & Checklist (Tasks 16-17)

| Task | Mô tả | File |
|------|-------|------|
| 16 | EmergencyDirectory + ChecklistManager | `ui/EmergencyDirectory.tsx`, `ui/ChecklistManager.tsx` |
| 17 | SOSHistoryPanel | `ui/SOSHistoryPanel.tsx` |

### Phase 4F: Page Assembly & Verify (Tasks 18-20)

| Task | Mô tả | File |
|------|-------|------|
| 18 | Alert Page | `src/app/alert/page.tsx` |
| 19 | Navigation Link | Homepage nav |
| 20 | Verify & Polish | Build + dev + test all features |

---

## Phần IX: File Structure

```
src/
├── app/
│   └── alert/
│       └── page.tsx                          # Task 18
├── features/
│   ├── alert-sos/
│   │   ├── api/
│   │   │   └── mock-data.ts                  # Task 3
│   │   ├── config/
│   │   │   └── alert-config.ts               # Task 2
│   │   ├── lib/
│   │   │   ├── types.ts                      # Task 1
│   │   │   ├── alert-sos-context.tsx          # Task 5
│   │   │   ├── relevance-engine.ts            # Task 6
│   │   │   ├── escalation-engine.ts           # Task 7
│   │   │   ├── offline-queue.ts               # Task 8
│   │   │   ├── emergency-directory.ts         # Task 9
│   │   │   ├── checklist-data.ts              # Task 10
│   │   │   └── use-alert-hooks.ts             # Task 11
│   │   └── ui/
│   │       ├── AlertStatsBar.tsx              # Task 12
│   │       ├── AlertMap.tsx                   # Task 13
│   │       ├── SOSPanel.tsx                   # Task 14
│   │       ├── AlertFeed.tsx                  # Task 15
│   │       ├── AlertDetailModal.tsx           # Task 15
│   │       ├── EmergencyDirectory.tsx         # Task 16
│   │       ├── ChecklistManager.tsx           # Task 16
│   │       └── SOSHistoryPanel.tsx            # Task 17
│   ├── community-report/                     # (existing)
│   ├── map-disaster/                         # (existing)
│   └── predict/                              # (existing, planned)
└── lib/
    ├── types.ts                              # (existing)
    └── utils.ts                              # (existing)
```

---

## Phần X: Execution Order

```
Phase 4A: Task 1 → 2 → 3 → 4 → 5
Phase 4B: Task 6 → 7 → 8 → 9 → 10 → 11
Phase 4C: Task 12 → 13
Phase 4D: Task 14 → 15
Phase 4E: Task 16 → 17
Phase 4F: Task 18 → 19 → 20
```

**Cơ hội song song:**
- Tasks 12-13 (Stats + Map) chạy song song
- Tasks 14-15 (SOS + AlertFeed) chạy song song
- Tasks 16-17 (Directory + Checklist + History) chạy song song

---

## Phần XI: Innovation Points (Điểm Ấn tượng cho Hội đồng)

| # | Innovation | Nguồn cảm hứng | Điểm khác biệt |
|---|-----------|----------------|---------------|
| 1 | **CAP-Inspired Alert Format** | OASIS CAP v1.2 | Lần đầu áp dụng chuẩn quốc tế tại VN |
| 2 | **AI Relevance Filtering** | Alert fatigue research | 5-factor scoring, giảm cảnh báo giả |
| 3 | **Multi-channel Escalation** | FEMA IPAWS | Push → SMS → Zalo → Loa, tự động tăng |
| 4 | **Offline-first SOS** | GoTenna, Bridgefy | IndexedDB + Background Sync, cứu người khi mạng sập |
| 5 | **Geo-targeted Alerts** | FEMA WEA 3.0 | Point-in-polygon (Turf.js), cảnh báo theo khu vực |
| 6 | **Seasonal Preparedness** | FEMA Ready.gov | Checklist tự động theo mùa + khu vực |
| 7 | **Emergency Directory** | Vietnam emergency numbers | Danh sách theo tỉnh, 1 chạm gọi |
| 8 | **SOS Status Tracking** | Apple Emergency SOS | Real-time: sent → delivered → dispatched → resolved |
| 9 | **Vietnam-Specific Data** | VNDMA, EM-DAT | Số cứu hộ thực tế, checklist mùa mưa bão VN |
| 10 | **Alert Fatigue Mitigation** | Relevance scoring | Severity throttling + quiet hours + dedup |

---

## Phần XII: Risk Mitigation

| Rủi ro | Ảnh hưởng | Giải pháp |
|--------|-----------|-----------|
| Web Push cần HTTPS | Không push ở dev | Dùng in-app notification cho dev |
| Background Sync chỉ Chrome | Safari offline fail | Periodic retry fallback (30s) |
| IndexedDB phức tạp | Bug | Dùng pattern đơn giản, test kỹ |
| SMS/Zalo không gửi thật | Mock only | Hiển thị UI demo, mock delivery |
| GPS accuracy trong nhà | Sai vị trí | Hiển thị accuracy, cho phép nhập thủ công |
| Alert sound gây khó chịu | UX problem | Chỉ extreme mới có âm thanh, cho phép tắt |
| Checklist quá dài | Người dùng overwhelmed | Ưu tiên "essential", collapse optional |
| Số liệu liên hệ sai | Gây hại | Dùng số công khai, thêm disclaimer |

---

## Phần XIII: Scope Boundaries

### INCLUDED (Bao gồm):
- Geo-targeted alert system (CAP-inspired)
- AI relevance filtering (5-factor scoring)
- Multi-channel escalation (push → SMS → Zalo mock)
- SOS 1-tap với GPS auto-capture
- Offline SOS queue (IndexedDB + Background Sync)
- Emergency directory theo tỉnh
- Seasonal preparedness checklist
- Alert map với severity zones
- SOS history tracking
- Responsive dark-themed UI

### EXCLUDED (Không bao gồm):
- Gửi SMS thật (mock only)
- Tích hợp Zalo OA thật (mock only)
- Tích hợp loa/IoT thật
- Cell Broadcast (cần hợp tác nhà mạng)
- What3Words (API trả phí)
- Push notification server (VAPID keys + server)
- Phân tích CAP XML thật (dùng JSON)
- Đa ngôn ngữ (chỉ tiếng Việt)
- Voice alerts / TTS
- Crash detection (phần cứng)

---

## Phần XIV: Verification Checklist

1. [ ] `npm run build` - zero errors
2. [ ] `npm run dev` - http://localhost:3000/alert loads
3. [ ] Tất cả 5 tabs navigate đúng
4. [ ] AlertMap hiển thị vùng cảnh báo + markers
5. [ ] SOS button hoạt động (GPS capture, confirm, send)
6. [ ] Offline SOS queueing hoạt động (toggle network)
7. [ ] AlertFeed hiển thị đúng severity colors
8. [ ] AlertDetailModal hiển thị đầy đủ CAP fields
9. [ ] Emergency Directory hiển thị đúng contacts theo tỉnh
10. [ ] Checklist items filter theo province và season
11. [ ] Checklist progress lưu vào localStorage
12. [ ] Checklist printable version hoạt động
13. [ ] Mobile responsive (375px viewport)
14. [ ] Console: no errors
15. [ ] Performance: relevance calc < 50ms

---

## Phần XV: Design Tokens

### Colors
```
Alert Severity:     #DC2626 (extreme), #EA580C (severe), #CA8A04 (moderate), #16A34A (minor)
SOS Status:         #3B82F6 (queued), #A855F7 (sent), #F59E0B (delivered), #22C55E (dispatched/resolved)
SOS Button:         #DC2626 (bg), #FFFFFF (text), pulsing shadow
Emergency:          #3B82F6 (police), #EF4444 (fire), #22C55E (ambulance), #06B6D4 (coast_guard)
Checklist:          #22C55E (completed), #6B7280 (pending), #F59E0B (essential)
```

### Typography
```
SOS Button:     text-4xl font-black
Alert Headline: text-lg font-semibold
Stats Number:   text-2xl font-bold
Contact Number: text-xl font-bold
```

### Animation
```
SOS pulse:       2s infinite, scale 1→1.1 + shadow ripple
Alert entrance:  0.3s ease, slide down
Stats counter:   spring, stiffness: 100, damping: 15
Card stagger:    0.05s delay
Checklist check: 0.2s ease, scale 0→1
```

---

## Phần XVI: Tổng kết

### Phase 4 Module Cảnh Báo & SOS

- **10 tính năng** (4 nhóm: Cảnh báo, SOS, Khẩn cấp, UX)
- **20 tasks** chia 6 phases (4A → 4F)
- **8 UI components**
- **18 mục checklist** (6 nhóm)
- **15 tỉnh** với danh sách khẩn cấp
- **20 mock alerts** + **30 mock SOS**

### Tại sao module này "bùng nổ" cho luận văn:

1. **CAP-Inspired** - Chuẩn quốc tế OASIS, lần đầu tại VN
2. **AI Relevance** - Giảm alert fatigue, không ai ở VN làm
3. **Offline SOS** - Cứu người khi mạng sập, giải quyết pain point thật
4. **Multi-channel Escalation** - Push → SMS → Zalo → Loa
5. **Seasonal Checklist** - Phòng ngừa trước thiên tai
6. **Dữ liệu thực tế** - Bão Yagi 2024, Damrey 2017, lũ miền Trung 2020
7. **Bangladesh Model** - 76,000 tình nguyện viên giảm 98% thương vong

### Kết nối với các Phase khác:

```
Phase 1 (Bản đồ) ← Phase 4 dùng MapContainer + TileLayer
Phase 2 (AI Dự đoán) → Phase 4 nhận prediction → tạo alert
Phase 3 (Báo cáo) → Phase 4 nhận community reports → xác minh alert
Phase 4 (Cảnh báo & SOS) → Phase 5 (Phối hợp cứu trợ) nhận SOS → dispatch
```

---

## Tài liệu Tham khảo

1. OASIS CAP v1.2: docs.oasis-open.org/emergency/cap/v1.2/
2. FEMA IPAWS: fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system
3. 3GPP Cell Broadcast: 3gpp.org/specifications
4. Sendai Framework: undrr.org/sendai-framework
5. Wikipedia - Typhoon Yagi (2024)
6. Wikipedia - Typhoon Damrey (2017)
7. World Bank Vietnam: worldbank.org/en/country/vietnam
8. EM-DAT: emdat.be
9. ReliefWeb: reliefweb.int
10. Bangladesh CPP: IFRC, WMO reports
11. Project NOAH (Philippines): dost.gov.ph
12. InaTEWS (Indonesia): bmkg.go.id
13. Yurekuru Call: rc-solution.co.jp
14. Ushahidi: ushahidi.com
15. What3Words: what3words.com
16. FEMA Ready.gov: ready.gov
17. UNDRR: undrr.org
18. ADRC: adrc.asia
19. IFRC: ifrc.org
