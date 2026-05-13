# SUPER MASTER PLAN: Phase 5 - Module Phối Hợp Cứu Trợ (Rescue Coordination)

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1-4 đã hoàn thành:
- Phase 1: Bản đồ Thiên Tai ✅
- Phase 2: AI Dự Đoán ✅ (planned)
- Phase 3: Báo cáo Cộng đồng ✅
- Phase 4: Cảnh Báo & SOS ✅

**Phase 5: Module Phối Hợp Cứu Trợ** - module biến CứuNet từ "hệ thống giám sát & cảnh báo" thành "hệ thống HÀNH ĐỘNG". Đây là "soul" của luận văn.

**Tại sao module này là "missing piece":**
- Phase 1-4: Phát hiện → Dự đoán → Báo cáo → Cảnh báo = **BIẾT** có thiên tai
- Phase 5: Phối hợp → Triển khai → Cứu hộ → Quản lý = **HÀNH ĐỘNG** cứu người
- Kết nối toàn bộ workflow: Map → Predict → Report → Alert → **Rescue**
- Hội đồng: "Hệ thống không chỉ cảnh báo mà còn ĐIỀU PHỐI CỨU HỘ được"

---

## Phần I: Phân tích Vấn đề - Cứu hộ Thiên tai Việt Nam

### 1.1. Thực trạng cứu hộ thiên tai Việt Nam

#### Cơ cấu tổ chức hiện tại (Chi tiết)

```
Ủy ban Quốc gia Ứng phó sự cố, thiên tai & Tìm kiếm cứu nạn
├── Bộ Quốc phòng (Quân đội nhân dân)
│   ├── Binh chủng Công binh
│   ├── Quân khu 1 (Thái Nguyên) - Đông Bắc, Upper North
│   ├── Quân khu 2 (Vĩnh Phúc) - Tây Bắc, Upper North
│   ├── Quân khu 3 (Hải Phòng) - Đồng bằng sông Hồng
│   ├── Quân khu 4 (Nghệ An) - Bắc Trung Bộ
│   ├── Quân khu 5 (Đà Nẵng) - Nam Trung Bộ
│   ├── Quân khu 7 (TP.HCM) - Đông Nam Bộ
│   ├── Quân khu 9 (Cần Thơ) - Đồng bằng sông Cửu Long
│   └── Lực lượng Tìm kiếm cứu nạn (SAR)
├── Bộ Công an
│   ├── Cảnh sát PCCC & CNCH
│   └── Công an địa phương
├── Bộ Nông nghiệp & PTNT
│   └── VNDMA (Cục Phòng, chống thiên tai)
│       ├── 6 Văn phòng vùng
│       ├── Phòng Phòng chống thiên tai
│       ├── Phòng Đê điều
│       └── Phòng Khoa học & Hợp tác quốc tế
├── Bộ Y tế
│   └── Đội cấp cứu ngoại viện
├── Trung ương Hội Chữ thập đỏ Việt Nam (VNRC)
│   ├── 63 tỉnh/thành Hội (~2 triệu thành viên)
│   ├── Chương trình CBDRM (10,000+ xã)
│   └── Đội phản ứng nhanh
└── Các tổ chức quốc tế
    ├── UN OCHA, UNDP, UNICEF
    ├── IFRC, ICRC
    ├── JICA (Nhật), KOICA (Hàn Quốc)
    ├── AHA Centre (ASEAN)
    └── Các NGO (CARE, Oxfam, Save the Children)
```

#### Vấn đề cốt lõi

| Vấn đề | Mô tả | Nguồn |
|--------|--------|-------|
| **Phối hợp rời rạc** | Mỗi cơ quan hoạt động độc lập, không có hệ thống chung | UNDRR 2024, WB Vietnam |
| **Thông tin bất đối xứng** | Chỉ huy không biết đội nào ở đâu, đang làm gì | Post-Yagi 2024 Assessment |
| **Chưa có 3W Dashboard** | Không biết Who đang What ở Where | OCHA Gap Analysis |
| **Điều phối thủ công** | Zalo group, phone call, giấy tờ | VNRC After-Action Report |
| **Không có triage tự động** | SOS đến → con người đánh giá → chậm | IFRC Digital Transformation |
| **Tình nguyện viên tự phát** | Không quản lý, không skill matching | Youth Union Report 2024 |
| **Nơi trú ẩn thiếu thông tin** | Không biết còn chỗ hay đã đầy | Post-Damrey 2017 Assessment |
| **Không có audit trail** | Không review được sau sự cố | ICS Best Practices |
| **Xã phường yếu nhất** | Ủy ban PCTT cấp xã thiếu nhân lực, ngân sách, tồn tại trên giấy | VNDMA Assessment |
| **Hạ tầng thông tin kém** | Mất sóng di động khi bão, vùng núi không có sóng | GSMA Vietnam Report |

#### Thảm họa Yagi 2024 - Case Study Chi tiết

**Timeline:**
- 1-2/9: Yagi hình thành áp thấp nhiệt đới phía đông Philippines
- 3-4/9: Mạnh lên siêu bão (Category 4-5) trên Biển Đông
- 7/9 13:00: Đổ bộ Quảng Ninh - Hải Phòng (gió 150-160 km/h)
- 7-8/9: Di chuyển vào đất liền, gây lũ lụt thảm khốc miền Bắc
- 8-15/9: Lũ sau bão tàn phá đồng bằng sông Hồng

**Con số:**
- **325 người chết**, 50+ mất tích, 1,987 bị thương
- **5.7 triệu** người mất điện
- **100,000+** nhà bị phá hủy, 200,000+ nhà bị hư hại
- **84.5 nghìn tỷ** (~$3.47B) thiệt hại
- **200,000+ ha** lúa bị phá hủy
- Cầu Phong Chùa (Phú Thọ) sập, cô lập nhiều xã

**Vấn đề phối hợp bộc lộ:**
- Quân đội, công an, VNRC, tình nguyện viên đến cùng khu vực nhưng không phối hợp
- Zalo group bị spam, mất thông tin quan trọng
- Không biết đội nào đang ở đâu
- Nơi trú ẩn quá tải nhưng không có hệ thống cảnh báo
- Tình nguyện viên đến nhiều nhưng không có skill matching
- Ủy ban quốc gia triệu tập muộn (6/9) - chưa đầy 24h trước khi bão đổ bộ
- Lũ quét miền núi (Cao Bằng, Lạng Sơn) bất ngờ dù đã có cảnh báo

#### Các thảm họa lớn khác

| Sự kiện | Thương vong | Thiệt hại | Vấn đề phối hợp |
|---------|------------|-----------|-----------------|
| **Bão Damrey 2017** | 107 chết | ~$1B | Khánh Hòa mất liên lạc 24-48h, APEC chiếm tài nguyên |
| **Lũ miền Trung 2020** | 249 chết | ~$2.1B | 6 bão liên tiếp 5 tuần, 13 quân nhân hi sinh tại Rào Trăng |
| **Sạt lở Quảng Nam 2020** | 40+ chết | - | 4 vụ sạt lở lớn, cứu hộ bị sạt lở thứ cấp |

#### Mùa thiên tai Việt Nam

| Tháng | Vùng | Loại thiên tai |
|-------|------|----------------|
| 5-7 | Bắc bộ | Mưa lớu đầu mùa, lũ quét miền núi |
| 8-10 | Bắc Trung - Nam Trung Bộ | Mùa bão chính (corridor bão) |
| 10-11 | Trung Bộ | Bão muộn + mưa lớu chồng lũ (tệ nhất) |
| 12-4 | ĐBSCL | Ngập mặn, hạn hán |
| Year-round | TP.HCM | Ngập úng đô thị |

### 1.2. Khoảng cách CứuNet có thể lấp đầy

| Khoảng cách | Giải pháp CứuNet | Chuẩn quốc tế |
|-------------|-----------------|---------------|
| Không có hệ thống phối hợp chung | Rescue Context + Operations Map | ICS (FEMA) |
| Không biết Who-What-Where | 3W Dashboard | UN OCHA 3W |
| SOS không có triage tự động | Priority Triage Engine | START Triage |
| Điều phối thủ công | Geospatial Dispatch Algorithm | AVL (FEMA) |
| Tình nguyện viên tự phát | Volunteer Lifecycle Management | IFRC Volunteer Toolkit |
| Nơi trú ẩn thiếu thông tin | Shelter Management System | Shelter Cluster (IASC) |
| Không có audit trail | Incident Timeline | ICS Form 214 |
| Không có check-in an toàn | Safety Check-in System | Safe & Well (ARC) |
| Không có Unified Command | Multi-agency Coordination | ICS Unified Command |
| Communication qua Zalo | Communication Hub | WebEOC, D4H |

---

## Phần II: Nghiên cứu Quốc tế - Hệ thống Cứu hộ Toàn cầu

### 2.1. ICS - Incident Command System (FEMA/NIMS)

**Nguồn:** FEMA IS-100.c, IS-200.c, IS-700.b, IS-800.d

ICS là chuẩn quốc tế quản lý sự cố, được sử dụng bởi:
- **Mỹ:** FEMA, tất cả cơ quan liên bang
- **Úc:** AIIMS (Australasian Inter-service Incident Management System)
- **Anh:** Gold-Silver-Bronze Command Structure
- **Nhật:** J-Alert + Cảm ứng hệ thống
- **ASEAN:** AHA Centre (ASEAN Coordinating Centre for Humanitarian Assistance)

#### ICS Core Principles (10 nguyên tắc cốt lõi)

```
1. Common Terminology     - Ngôn ngữ chung giữa các cơ quan
2. Modular Organization   - Tổ chức mô-đun, mở rộng theo sự cố
3. Management by Objectives - Quản lý theo mục tiêu
4. Incident Action Plan   - Kế hoạch hành động sự cố
5. Chain of Command       - Chuỗi chỉ huy rõ ràng
6. Unity of Command       - Mỗi người chỉ có 1 cấp trên
7. Unified Command        - Nhiều cơ quan, 1 mục tiêu chung
8. Resource Management    - Quản lý tài nguyên tập trung
9. Information Management - Quản lý thông tin thời gian thực
10. Integrated Communications - Truyền thông tích hợp
```

#### ICS Organizational Structure (Chi tiết)

```
                    ┌─────────────┐
                    │  Incident   │
                    │  Commander  │
                    └──────┬──────┘
                           │
        ┌──────────┬───────┼────────┬──────────┐
        │          │       │        │          │
   ┌────┴───┐ ┌───┴──┐ ┌──┴──┐ ┌───┴──┐ ┌────┴────┐
   │Public  │ │Safety│ │Liai-│ │ Ops  │ │Finance/ │
   │Info    │ │Offi- │ │son  │ │Sect. │ │Admin    │
   │Officer │ │cer   │ │Off. │ │Chief │ │Chief    │
   └────────┘ └──────┘ └─────┘ └──┬───┘ └─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
               ┌────┴───┐    ┌────┴───┐    ┌────┴───┐
               │Planning│    │Logis-  │    │Finance/│
               │Sect.   │    │tics    │    │Admin   │
               │Chief   │    │Chief   │    │Chief   │
               └────────┘    └────────┘    └────────┘
```

**Operations Section - Chi tiết Branches:**
- **Branches** (chức năng hoặc địa lý): Fire Branch, Law Enforcement Branch, Medical Branch
- **Divisions** (chia nhỏ theo địa lý trong mỗi branch)
- **Groups** (chức năng trong division): HAZMAT Group, SAR Group
- **Strike Teams** - Cùng loại tài nguyên + leader (5 xe cứu hỏa + 1 leader)
- **Task Forces** - Khác loại tài nguyên + leader (1 xe cứu hỏa + 1 xe cứu thương + 1 cảnh sát + 1 leader)

**Air Operations Branch:**
- Air Operations Branch Director → Operations Section Chief
- Air Tactical Group Supervisor
- Air Support Group Supervisor
- Helibase Manager
- ICS Form 220 (Air Operations Summary)

#### ICS Forms (Đầy đủ)

| Form | Tên | Mục đích |
|------|-----|----------|
| **ICS 201** | Incident Briefing | Tóm tắt sự cố cho IC mới tiếp quản |
| **ICS 202** | Incident Objectives | Mục tiêu cho mỗi operational period |
| **ICS 203** | Organization Assignment List | Danh sách vị trí/assignment |
| **ICS 204** | Assignment List | Tài nguyên được giao cho mỗi Division/Group |
| **ICS 205** | Incident Radio Communications Plan | Kênh radio, tần số, callsign |
| **ICS 206** | Medical Plan | Cơ sở y tế, vận chuyển, bệnh viện |
| **ICS 207** | Incident Organization Chart | Sơ đồ tổ chức |
| **ICS 208** | Safety Message/Plan | Thông điệp an toàn, rủi ro, PPE |
| **ICS 209** | Incident Status Summary | Báo cáo tình hình hàng ngày |
| **ICS 214** | Activity Log | Nhật ký hoạt động cá nhân/đơn vị |
| **ICS 215** | Operational Planning Worksheet | Worksheet phân công cho operational period tiếp |
| **ICS 220** | Air Operations Summary | Tình hình tài nguyên đường không |

**Incident Action Plan (IAP)** = Bundle ICS 202 + 203 + 204 + 205 + 206 + 208 cho mỗi operational period (12-24h).

#### Transfer of Command

1. **Notification** - Thông báo cho tất cả section chiefs
2. **Briefing** - IC cũ brief IC mới bằng ICS 201
3. **Authority Transfer** - "Effective [time], I am transferring command to [name]"
4. **Documentation** - Ghi nhận trên ICS 201 Section V
5. **Communication** - Radio: "Attention all units, command has been transferred to [name]"

#### Unified Command vs Single Command

**Single Command:** 1 IC có toàn quyền. Dùng khi 1 cơ quan/jurisdiction.

**Unified Command:** Nhiều cơ quan chia sẻ quyền chỉ huy nhưng giữ quyền tự chủ. Mỗi cơ quan có representative tại command level. Tất cả cùng phát triển 1 bộ mục tiêu chung (ICS 202).

**CứuNet Simplified ICS (Việt hóa):**

```
SỞ CHỈ HUY TIỀN PHƯƠNG (Incident Commander)
├── BAN THAO TÁC (Operations Section)
│   ├── Nhóm Tìm kiếm Cứu nạn (SAR Team)
│   ├── Nhóm Sơ tán (Evacuation Team)
│   ├── Nhóm Y tế (Medical Team)
│   └── Nhóm Hậu cần (Logistics Team)
├── BAN KẾ HOẠCH (Planning Section)
│   ├── Tình hình hiện tại (Situation Unit)
│   ├── Theo dõi tài nguyên (Resource Unit)
│   └── Lập bản đồ 3W (Documentation Unit)
├── BAN HẬU CẦN (Logistics Section)
│   ├── Cung cấp vật tư (Supply Unit)
│   ├── Quản lý nơi trú ẩn (Shelter Unit)
│   └── Vận tải (Transport Unit)
└── BAN TRUYỀN THÔNG (Communications)
    ├── Nội bộ (Internal Comms)
    ├── Công khai (Public Information)
    └── Xử lý SOS (SOS Processing)
```

### 2.2. UN OCHA - 3W/4W/5W Dashboard

**Nguồn:** OCHA Humanitarian Data Exchange (HDX), 3W Standard

#### 3W Core Data Model

```
3W Record {
    // WHO
    organization_id: string
    organization_name: string
    organization_type: enum (UN, NGO, Red Cross, Government, Military)
    organization_acronym: string

    // WHAT
    cluster_id: string
    cluster_name: string ("Health", "WASH", "Protection")
    sector_id: string
    activity_type: string
    activity_description: string
    beneficiary_type: string ("IDPs", "Host community")

    // WHERE
    admin1_id: string (Tỉnh)
    admin1_name: string
    admin2_id: string (Huyện)
    admin2_name: string
    admin3_id: string (Xã)
    admin3_name: string
    location_lat: decimal
    location_lon: decimal
}
```

**11 Standard Clusters:**
1. Camp Coordination / Camp Management (CCCM)
2. Early Recovery
3. Education
4. Emergency Shelter & NFI
5. Emergency Telecommunications
6. Food Security
7. Health
8. Logistics
9. Nutrition
10. Protection
11. WASH (Water, Sanitation & Hygiene)

#### 4W Extension (3W + When)

```
activity_start_date: date
activity_end_date: date
activity_status: enum (Planned, Ongoing, Completed, Suspended)
```

Cho phép phân tích temporal - khi nào coverage gaps xuất hiện.

#### 5W Extension (4W + How Many)

```
target_beneficiaries: integer
actual_beneficiaries: integer
beneficiary_male: integer
beneficiary_female: integer
beneficiary_children_under_5: integer
beneficiary_disabled: integer
delivery_status: enum (On track, Delayed, Completed)
```

Gap analysis: "Tại Huyện X, 50,000 người cần dịch vụ y tế, nhưng chỉ 20,000 được tiếp cận."

#### Case Studies 3W Implementation

| Sự kiện | Thời gian激活 | Tổ chức theo dõi | Bài học |
|---------|--------------|-----------------|---------|
| **Haiti 2010** | 3 tuần sau | 400+ tổ chức, 10 departments | Phải激活 trong 48h dù dữ liệu chưa đầy đủ |
| **Nepal 2015** | 72 giờ | 341 tổ chức, 75 districts, 11 clusters | Dùng VDC boundaries làm admin3 |
| **Ukraine 2022** | Tuần 1 | 600+ tổ chức, 24 oblasts | Real-time updates hàng tuần (không quarterly) |

### 2.3. START Triage System

**Nguồn:** Simple Triage and Rapid Treatment, California EMSA (1983)

#### START Algorithm (Decision Tree đầy đủ)

```
Step 1: BỆNH NHÂN ĐI ĐƯỢC KHÔNG?
├── CÓ → XANH (Minor) → Khu điều trị
└── KHÔNG ↓

Step 2: BỆNH NHÂN THỞ KHÔNG?
├── KHÔNG → Mở đường thở
│   ├── Vẫn không thở → ĐEN (Expectant)
│   └── Bây giờ thở → ĐỎ (Immediate)
├── THỞ nhưng bất thường (>30/phút) → ĐỎ (Immediate)
└── THỞ bình thường ↓

Step 3: ĐÁNH GIÁ TUẦN HOÀN (Mạch quay tay hoặc nạp mao mạch)
├── Không có mạch quay HOẶC nạp mao mạch >2 giây → ĐỎ (Immediate)
└── Có mạch quay VÀ nạp mao mạch <2 giây ↓

Step 4: ĐÁNH GIÁ TINH THẦN
├── Không làm theo lệnh đơn giản → ĐỎ (Immediate)
└── Làm theo lệnh đơn giản → VÀNG (Delayed)
```

**Thời gian:** <60 giây mỗi bệnh nhân

| Màu | Ưu tiên | Mô tả |
|-----|---------|-------|
| 🔴 ĐỎ | 1 - Immediate | Nguy hiểm tính mạng, có thể cứu được |
| 🟡 VÀNG | 2 - Delayed | Nghiêm trọng nhưng có thể chờ |
| 🟢 XANH | 3 - Minor | Thương nhẹ, đi được |
| ⚫ ĐEN | 4 - Expectant | Tử vong hoặc thương tích không thể cứu |

#### JumpSTART (Phiên bản Nhi khoa)

**Dành cho bệnh nhân <8 tuổi:**
- Tần số hô hấp bình thường: 15-45/phút (người lớn: <30)
- Dùng thang AVPU thay vì lệnh đơn giản (trẻ em có thể không hiểu lệnh)
- Cho 5 hơi thở cứu hộ trước khi tuyên bố expectant
- Không dùng nạp mao mạch là đánh giá chính (không đáng tin cậy ở trẻ em)

#### SALT Triage (Sort, Assess, Lifesaving interventions, Treatment/Transport)

**Mới hơn START (CDC 2006, cập nhật 2021):**

**Phase 1 - SORT (Phân loại toàn cục, ~30 giây):**
- "Nếu nghe được giọng tôi và đi được, hãy đến đây"
- Bất động → Chết hoặc thương nặng
- Di chuyển → Có thể làm theo lệnh
- Chảy máu nhiều → Nhận diện người có vết thương rõ

**Phase 2 - ASSESS (Đánh giá cá nhân):**
1. Chảy máu nhiều? → Áp dụng garo → ĐỎ
2. Thở? → Không → Mở đường thở → Vẫn không → ĐEN
3. Có mạch? → Không → ĐỎ
4. Làm theo lệnh? → Không → ĐỎ → Có → VÀNG

**Phase 3 - LIFESAVING INTERVENTIONS (<5 phút/bệnh nhân):**
- Garo, ép trực tiếp, mở đường thở, dẫn lưu ngực
- **KHÔNG hồi sinh** trong sự cố mass casualty

**SALT vs START:**

| Tiêu chí | START | SALT |
|----------|-------|------|
| Độ tuổi | Chỉ người lớn | Mọi lứa tuổi |
| Phân loại toàn cục | Không | Có (Phase 1) |
| Can thiệp cứu sống | Hạn chế | Danh sách rõ ràng |
| Kiểm soát chảy máu | Không nhấn mạnh | Ưu tiên số 1 |
| Nghiên cứu | 1983 expert consensus | 2006-2021 CDC evidence |

### 2.4. IFRC - Volunteer Management

**Nguồn:** IFRC Volunteer Management Toolkit, Red Cross Red Crescent

Vòng đời tình nguyện viên:
```
Registration → Orientation → Training → Assignment → Supervision → Recognition
     ↓              ↓           ↓           ↓             ↓            ↓
  Thông tin    Giới thiệu   Đào tạo    Phân công    Giám sát    Ghi nhận
  cá nhân      quy tắc     kỹ năng    theo skill   + đánh giá   + chứng nhận
```

**CứuNet Volunteer Lifecycle:**
1. **Registration:** Đăng ký qua app (tên, SĐT, kỹ năng, vị trí)
2. **Skills Assessment:** Tự khai + xác minh bởi tổ chức
3. **Availability:** Cập nhật trạng thái sẵn sàng
4. **Matching:** AI match skills + proximity + experience
5. **Assignment:** Phân công vào sự cố/task
6. **Tracking:** Theo dõi giờ làm, đánh giá
7. **Certification:** Cấp chứng nhận sau sự cố

### 2.5. IASC Shelter Cluster

**Nguồn:** Inter-Agency Standing Committee (IASC), Shelter Cluster Guidelines

Chuẩn quản lý nơi trú ẩn quốc tế:
- **4 loại:** Emergency (khẩn cấp), Temporary (tạm thời), Transitional (chuyển tiếp), Permanent (vĩnh viễn)
- **Chỉ số:** Capacity, Occupancy, Facilities, Needs
- **Check-in/out:** Theo dõi người dân trong/từ nơi trú ẩn
- **Special needs:** Người già, trẻ em, khuyết tật, thai phụ

### 2.6. AVL - Automatic Vehicle Location

**Nguồn:** FEMA Resource Management, AVL Standards

AVL là hệ thống theo dõi vị trí tài nguyên tự động:
- GPS tracking cho xe cứu hộ, ca nô, trực thăng
- Real-time position trên bản đồ
- ETA calculation
- Route optimization

**CứuNet Dispatch Engine** (mở rộng AVL):
- Best-fit algorithm (không chỉ nearest)
- Multi-factor: Distance + Capability + Availability + Capacity + Speed
- Turf.js cho geospatial calculations

### 2.7. HXL - Humanitarian Exchange Language

**Nguồn:** hxlstandard.org, OCHA Centre for Humanitarian Data

HXL là chuẩn dữ liệu nhân đạo dùng hashtag-based metadata:
- `#adm1+name` = Tỉnh, `#adm2+name` = Huyện, `#adm3+name` = Xã
- `#org+name` = Tổ chức, `#org+type` = Loại tổ chức
- `#sector` = Lĩnh vực, `#activity+type` = Loại hoạt động
- `#targeted+num` = Số người mục tiêu, `#reached+num` = Số người tiếp cận
- `#date+start`, `#date+end` = Thời gian

**CứuNet:** Tag tất cả dữ liệu export bằng HXL để tương thích HDX.

### 2.8. Hệ thống tương tự quốc tế

#### Sahana Eden (Sri Lanka)
- **Kiến trúc:** Python/web2py, PostgreSQL, REST API
- **Modules:** Inventory, Request Management, Person Registry, Shelter, Mapping
- **Mạnh:** Open source, multi-language, highly customizable
- **Yếu:** UI cũ, performance chậm, documentation không đầy đủ

#### Ushahidi (Kenya)
- **Kiến trúc:** Laravel + Vue.js, MySQL, REST API
- **Mạnh:** Crowd-sourced reporting UX tốt nhất, SMS integration, verification workflow
- **Yếu:** Không quản lý operations, data quality, cần internet

#### Philippines DROMIC
- **Chức năng:** Real-time monitoring disaster response toàn quốc
- **Data:** Families affected, assistance provided, evacuation center status
- **Reporting:** Mỗi 6 giờ (active), hàng ngày (aftermath), hàng tuần (recovery)
- **Bài học:** Pre-disaster Risk Assessment (PDRA) 72/48/24h trước bão

#### Nhật Bản J-Alert
- **Tốc độ:** 4-5 giây từ phát hiện đến cảnh báo đầu tiên
- **Kênh:** TV, radio, mobile (ETWS), loa ngoài trời
- **EEW:** 1,000+ trạm địa chấn, phát hiện P-wave trước S-wave
- **Tự động:** Shinkansen phanh trong 2-3 giây, thang máy dừng tầng gần nhất

#### Thổ Nhĩ Kỳ-Syria 2023
- **Công nghệ:** e-Devlet portal, e-AFAD app, AHAS (SMS 85 triệu điện thoại trong 90 giây)
- **Satellite:** Sentinel-1 InSAR trong 6 giờ, Planet Labs hàng ngày
- **AI:** Đánh giá thiệt hại tòa nhà bằng satellite image comparison
- **Crowdsourcing:** HOT OSM mapping 500,000+ tòa nhà trong 72 giờ

---

## Phần III: Scope - Module Phối Hợp Cứu Trợ

### Tính năng chính (16 features)

#### Core Operations (6 features)
1. **SOS Request System** - One-tap distress signal với GPS, offline queueing, priority triage
2. **Incident Management** - CRUD incidents, status lifecycle (New → Active → Resolved → Closed)
3. **Task Assignment Board** - Kanban-style task workflow (New → Assigned → In Progress → Done)
4. **Resource Registry** - Manage boats, vehicles, supplies, shelters with real-time availability
5. **Priority Triage Engine** - Weighted scoring: severity × population × accessibility × time
6. **Operations Map** - Leaflet map showing incidents, teams, shelters, resources in real-time

#### Coordination (5 features)
7. **3W Dashboard** (Who-What-Where) - UN OCHA-inspired: all active actors on map with assignments
8. **Volunteer Lifecycle** - Registration → Skills → Availability → Assignment → Certification
9. **Shelter Management** - Capacity tracking, needs assessment, check-in/out system
10. **Communication Hub** - Per-incident threads, broadcast announcements, status feed
11. **Incident Command Board** - ICS-based command structure visualization

#### Innovation (5 features)
12. **Geospatial Dispatch Algorithm** - AI-powered "best-fit unit" (not just nearest) using Turf.js
13. **Incident Timeline** - Immutable chronological log (audit trail for after-action review)
14. **Check-in/Safety Status** - Residents mark safe, auto-generate missing persons list
15. **Multi-agency Coordination** - Role-based views: Military, VNRC, Local Govt, Volunteers
16. **Resource Flow Visualization** - Sankey diagram showing resource allocation flow

### Tại sao 16 tính năng này?

| Tính năng | Giải quyết vấn đề gì | Chuẩn tham khảo |
|-----------|---------------------|-----------------|
| SOS System | Kết nối trực tiếp từ Phase 4 Alert → Rescue | FEMA IPAWS |
| Incident Management | Tổ chức sự cố theo chuẩn | ICS (FEMA) |
| Task Board | Quản lý công việc trực quan | Kanban (Toyota) |
| Resource Registry | Biết tài nguyên ở đâu, trạng thái gì | AVL (FEMA) |
| Triage Engine | Ưu tiên SOS tự động, không thủ công | START Triage |
| Operations Map | Nhìn toàn cảnh trên bản đồ | COP (Common Operating Picture) |
| 3W Dashboard | Ai đang làm gì ở đâu | UN OCHA 3W |
| Volunteer Lifecycle | Quản lý TVV có hệ thống | IFRC Toolkit |
| Shelter Management | Biết nơi trú ẩn còn chỗ không | IASC Shelter Cluster |
| Communication Hub | Thay Zalo group bằng hệ thống thống nhất | WebEOC, D4H |
| Incident Command Board | Hiển thị cấu trúc chỉ huy | ICS Unified Command |
| Incident Timeline | Audit trail cho after-action review | ICS Form 214 |
| Dispatch Algorithm | Best-fit, không chỉ nearest | AVL + Turf.js |
| Safety Check-in | Biết ai an toàn, ai mất tích | Safe & Well (ARC) |
| Multi-agency Views | Quân đội, VNRC, chính quyền nhìn khác nhau | ICS Unified Command |
| Resource Flow | Trực quan hóa phân bổ tài nguyên | Sankey (D3.js) |

---

## Phần IV: Kiến trúc Tổng quan

### 4.1. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          RESCUE PAGE (/rescue)                            │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ RescueStats  │ │ Operations   │ │  TaskBoard   │ │   Resource     │  │
│  │    Bar       │ │    Map       │ │  (Kanban)    │ │   Registry     │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───────┬────────┘  │
│         └─────────────────┴────────────────┴─────────────────┘           │
│                                 │                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │    SOS       │ │  3W          │ │  Shelter     │ │  Communication │  │
│  │   Panel      │ │  Dashboard   │ │  Manager     │ │     Hub        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                 │                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │  Volunteer   │ │  Incident    │ │  Dispatch    │ │  Check-in      │  │
│  │  Manager     │ │  Timeline    │ │  Advisor     │ │  Status        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                 │                                        │
│  ┌──────────────┐ ┌──────────────┐                                       │
│  │  Incident    │ │  Resource    │                                       │
│  │  Command     │ │  Flow        │                                       │
│  │  Board       │ │  (Sankey)    │                                       │
│  └──────────────┘ └──────────────┘                                       │
│                                 │                                        │
│                    ┌────────────┴────────────┐                           │
│                    │   Rescue Context         │                           │
│                    │   (React Context)        │                           │
│                    └────────────┬────────────┘                           │
│                                 │                                        │
│         ┌───────────────────────┼───────────────────────┐               │
│         │                       │                       │               │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌───────┴───────┐      │
│  │  Triage     │    │   Dispatch Engine   │   │   Offline     │      │
│  │  Engine     │    │   (Geospatial)      │   │   Sync Layer  │      │
│  └──────┬──────┘    └──────────┬──────────┘   └───────┬───────┘      │
│         │                      │                       │               │
│  ┌──────┴──────┐    ┌──────────┴──────────┐   ┌───────┴───────┐      │
│  │  Priority   │    │   Turf.js Distance  │   │   IndexedDB   │      │
│  │  Scoring    │    │   + Capability Match │   │   + localStorage│     │
│  └─────────────┘    └─────────────────────┘   └───────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Data Flow

```
User Action → UI Component → useRescue Hook → Rescue Context → Reducer → State Update
                                          ↓
                                    localStorage (persistence)
                                          ↓
                                    Mock Data (initialization)
```

### 4.3. Integration Points với Phase trước

```
Phase 1 (Map) ──────→ OperationsMap (reuse MapContainer, TileLayer, Leaflet patterns)
Phase 2 (Predict) ──→ Risk data cho triage scoring (terrain, flood zones)
Phase 3 (Report) ───→ Community reports → Incidents (auto-create from severe reports)
Phase 4 (Alert) ────→ SOS requests → Rescue workflow (trigger rescue from alert)
```

### 4.4. Technology Stack

| Công nghệ | Phiên bản | Sử dụng |
|-----------|-----------|---------|
| Next.js | 16.2.4 | App Router, SSR, dynamic import |
| React | 19.2.4 | Hooks, Context, useReducer |
| TypeScript | 5.x | Strict typing, union literals |
| Tailwind CSS | 4 | Dark glassmorphism theme |
| Framer Motion | 12 | Animations, transitions |
| Leaflet | 1.9.4 | Maps, markers, polygons |
| react-leaflet | 5 | React wrapper |
| Recharts | 2.15 | Charts (donut, bar, line) |
| lucide-react | 0.468 | Icons |
| @turf/turf | 7.x | Geospatial calculations |
| @dnd-kit/core | latest | Drag & drop framework |
| @dnd-kit/sortable | latest | Sortable lists for Kanban |
| clsx | latest | Conditional classes |

---

## Phần V: Chi tiết Từng Tính năng

### 5.1. Priority Triage Engine

**File:** `src/features/rescue/lib/triage-engine.ts`

**Thuật toán Weighted Scoring (mở rộng START):**

```
TriageScore = (Severity × 0.40) + (Population × 0.30) + (Accessibility × 0.20) + (Urgency × 0.10)
```

| Factor | Weight | Scoring Logic |
|--------|--------|---------------|
| Severity | 40% | life_threatening=100, urgent=75, need_help=50 |
| Population | 30% | Logarithmic: 1→10, 10→40, 100→70, 1000→100 |
| Accessibility | 20% | urban=95, suburban=80, rural=60, mountainous=35, flood_zone=15 |
| Urgency | 10% | 0h=0, 1h=30, 3h=60, 6h=80, 12h+=100 |

**Priority Classification:**
- P1 (≥80): Khẩn cấp - triển khai ngay
- P2 (≥60): Gấp - triển khai trong 1h
- P3 (≥40): Tiêu chuẩn - triển khai trong 4h
- P4 (<40): Thấp - theo dõi

**XAI-lite Explanation (Tiếng Việt):**
```
"Ưu tiên P1 (Khẩn cấp): Mức độ nghiêm trọng: nguy hiểm tính mạng,
15 người có nguy cơ, Khu vực khó tiếp cận, Thời gian chờ đợi lâu"
```

**START Triage Integration:**
- SOS có `triageMethod`: "start" | "salt" | "custom"
- START fields: canWalk, isBreathing, breathingRate, hasRadialPulse, followsCommands
- SALT fields: massiveHemorrhage, isBreathing, hasPulse, followsCommands
- Custom fields: severity, population, accessibility, urgency (weighted scoring)

### 5.2. Geospatial Dispatch Algorithm

**File:** `src/features/rescue/lib/dispatch-engine.ts`

**"Best-Fit Unit" Algorithm (không chỉ nearest):**

```
DispatchScore = (Distance × 0.35) + (Capability × 0.30) + (Availability × 0.20) + (Capacity × 0.10) + (Speed × 0.05)
```

| Factor | Weight | Logic |
|--------|--------|-------|
| Distance | 35% | Turf.js haversine, -2 per km |
| Capability | 30% | Match required capabilities vs unit capabilities |
| Availability | 20% | available=100, returning=50, deployed=0 |
| Capacity | 10% | unit.capacity / incident.peopleAtRisk |
| Speed | 5% | unit.speed / 100 |

**Required Capabilities by Disaster Type:**
```
flood → ["water_rescue", "boat"]
storm → ["heavy_equipment", "search_rescue"]
landslide → ["heavy_equipment", "search_rescue", "medical"]
earthquake → ["search_rescue", "heavy_equipment", "medical"]
tsunami → ["water_rescue", "boat", "medical"]
```

**Turf.js Functions sử dụng:**
- `turf.distance()` - Haversine distance giữa 2 điểm
- `turf.destination()` - Tính điểm đến từ khoảng cách + bearing
- `turf.bbox()` - Bounding box cho vùng ảnh hưởng
- `turf.booleanPointInPolygon()` - Kiểm tra điểm trong vùng
- `turf.nearestPoint()` - Tìm điểm gần nhất
- `turf.center()` - Tính trung tâm của feature

**Output:** Top 3 recommended units với:
- Match score (0-100)
- Estimated arrival time (minutes)
- Distance (km)
- Reasons (tags): "Gần nhất", "Đủ năng lực", "Sức chứa lớn", "Sẵn sàng ngay"

### 5.3. 3W Dashboard (Who-What-Where)

**File:** `src/features/rescue/lib/three-w.ts`

**Inspired by UN OCHA 3W Standard:**

```typescript
ThreeWEntry {
  who: { id, name, type (military|vnrc|local_govt|volunteer|ngo|private) }
  what: { activity, incidentId?, taskId?, resources[] }
  where: { lat, lng, province, district, zone? }
  when: { started, estimatedEnd? }
  status: "active" | "completed" | "planned"
}
```

**Organization Type Colors (theo chuẩn quốc tế):**
- Military: #EF4444 (Đỏ)
- VNRC: #DC2626 (Đỏ đậm - Red Cross)
- Local Govt: #3B82F6 (Xanh dương)
- Volunteer: #22C55E (Xanh lá)
- NGO: #A855F7 (Tím)
- Private: #F59E0B (Amber)

**5W Extension (CứuNet Innovation):**
- Thêm `targetBeneficiaries`, `actualBeneficiaries`
- Gap analysis: "Quảng Ninh: 50,000 người cần shelter, chỉ 20,000 được tiếp cận"

### 5.4. Incident Management (ICS-Based)

**File:** `src/features/rescue/lib/types.ts` (Incident interface)

**Status Lifecycle:**
```
New → Active → Resolved → Closed
         ↓
    Escalated (if needed)
```

**Incident Fields:**
- id, title, type (disaster type), severity, status
- location (lat, lng, province, district)
- description, peopleAtRisk, affectedArea (km²)
- commanderId (Incident Commander)
- createdAt, updatedAt, resolvedAt

**ICS Integration:**
- `commandStructure`: ICS org chart (IC, Operations, Planning, Logistics, Finance)
- `incidentActionPlan`: Current IAP (objectives, assignments, communications)
- `operationalPeriod`: 12-24h cycle

### 5.5. Task Assignment Board (Kanban)

**File:** `src/features/rescue/ui/TaskBoard.tsx`

**4 Columns:**
```
Mới → Được giao → Đang thực hiện → Hoàn thành
(New)  (Assigned)   (In Progress)    (Done)
```

**Task Fields:**
- id, title, description, incidentId
- assigneeId (team or volunteer)
- priority (P1-P4)
- status (new|assigned|in_progress|done)
- dueTime, completedAt
- subtasks[]

**Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- `DndContext` wraps entire board for cross-column drag
- `SortableContext` wraps each column for within-column sorting
- `useSortable` hook for each draggable item
- `onDragOver` handles cross-column movement
- `onDragEnd` finalizes position after drop
- `PointerSensor` + `KeyboardSensor` for accessibility

### 5.6. Resource Registry

**File:** `src/features/rescue/ui/ResourceRegistry.tsx`

**Resource Types (theo NIMS typing):**
- 🚤 Boat (ca nô) - water_rescue, supply_delivery
- 🚁 Helicopter - aerial_survey, medical_evacuation
- 🚑 Ambulance - medical_transport
- 🚒 Fire Truck - heavy_equipment, water_pump
- 👥 Rescue Team - search_rescue, first_aid
- 🏥 Medical Team - medical, triage
- 📦 Supply Truck - supply_delivery

**Status:** available → deployed → returning → maintenance

**CRUD Operations:**
- Add new resource (type, name, capacity, location, capabilities)
- Edit resource details
- Deploy resource to incident
- Return resource from deployment
- Mark as maintenance

### 5.7. Shelter Management

**File:** `src/features/rescue/ui/ShelterManager.tsx`

**Shelter Types (theo IASC):**
- Evacuation (điểm sơ tán)
- Temporary (nơi trú ẩn tạm thời)
- Transitional (nơi trú ẩn chuyển tiếp)
- Permanent (nơi trú ẩn cố định)
- Medical (bệnh viện dã chiến)

**Features:**
- Occupancy gauge (SVG circular, color-coded theo %)
- Capacity tracking (max/current/reserved)
- Needs assessment (food, water, medical, clothing, blankets)
- Check-in/out system
- Special needs tracking (elderly, disabled, pregnant, child)

**Occupancy Colors:**
```
<50%: #22C55E (Xanh lá - Còn nhiều chỗ)
50-80%: #EAB308 (Vàng - Sắp đầy)
80-95%: #F97316 (Cam - Gần đầy)
>95%: #EF4444 (Đỏ - Đã đầy)
```

### 5.8. Volunteer Lifecycle

**File:** `src/features/rescue/ui/VolunteerManager.tsx`

**Volunteer Types:**
- Registered (đã đăng ký qua app)
- Spontaneous (tự phát đến)
- Professional (chuyên nghiệp, có chứng chỉ)

**Skills Matching Algorithm:**
```
MatchScore = (SkillMatch × 0.40) + (Proximity × 0.35) + (Experience × 0.25)
```

**Skills Categories:**
- Search & Rescue (SAR)
- First Aid / Medical
- Water Rescue
- Heavy Equipment Operation
- Communication (Radio)
- Logistics / Supply Chain
- Translation (Ethnic minority languages)
- Counseling / Psychosocial Support

### 5.9. Communication Hub

**File:** `src/features/rescue/ui/CommunicationHub.tsx`

**Discord-like Layout:**
- Left: Channel list (per-incident + command + logistics + medical)
- Center: Message list + input
- Right: Participant list + online status

**Message Types:**
- Text (chat thường)
- Status update (system-generated)
- Resource request (structured form)
- Location share (map card)
- System notification

**Broadcast Announcement:**
- Target: all | volunteers | military | vnrc | specific_incident
- Priority: normal | urgent | critical

### 5.10. Incident Timeline

**File:** `src/features/rescue/ui/IncidentTimeline.tsx`

**Event Types (25+):**
```
incident_created, incident_updated, incident_escalated, incident_resolved, incident_closed
task_created, task_assigned, task_started, task_completed
resource_deployed, resource_returned
volunteer_assigned, volunteer_released
shelter_opened, shelter_updated, shelter_closed
sos_received, sos_triaged, sos_dispatched, sos_resolved
status_update, message_sent, broadcast_sent
check_in, check_out, note_added
command_transferred, iap_created, iap_updated
```

**Immutable Audit Trail:** Mỗi event có timestamp + actor + description → không thể sửa

### 5.11. Safety Check-in

**File:** `src/features/rescue/ui/CheckInStatus.tsx`

**Check-in Status:**
- safe (an toàn)
- need_help (cần giúp đỡ)
- missing (mất tích)
- evacuated (đã sơ tán)
- hospitalized (nhập viện)

**Auto-generate Missing Persons List:**
```
Missing = Expected Population - (Safe + NeedHelp + Evacuated + Hospitalized)
+ Separated Family Members
```

### 5.12. Dispatch Advisor

**File:** `src/features/rescue/ui/DispatchAdvisor.tsx`

**"Đề xuất triển khai" UI:**
- Top 3 recommended units (ranked by score)
- Each unit: name, type icon, match score gauge, ETA, distance, reasons
- "Triển khai" button
- Comparison view (side by side)

### 5.13. Incident Command Board

**File:** `src/features/rescue/ui/IncidentCommandBoard.tsx`

**ICS Org Chart Visualization:**
- Tree structure showing command hierarchy
- Click to see details of each position
- Assign personnel to positions
- Transfer of command workflow

### 5.14. Resource Flow Visualization

**File:** `src/features/rescue/ui/ResourceFlow.tsx`

**Sankey Diagram:**
- Nguồn tài nguyên → Sự cố → Kết quả
- D3-sankey cho visualization
- Color-coded theo loại tài nguyên
- Interactive: hover để xem chi tiết

---

## Phần VI: File Structure

```
src/
├── app/
│   └── rescue/
│       └── page.tsx                          # Main rescue page
├── features/
│   ├── rescue/
│   │   ├── api/
│   │   │   └── mock-data.ts                  # Mock data generator
│   │   ├── config/
│   │   │   └── rescue-config.ts              # Configuration constants
│   │   ├── lib/
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   ├── rescue-context.tsx            # React Context + Reducer
│   │   │   ├── triage-engine.ts              # Priority scoring algorithm
│   │   │   ├── dispatch-engine.ts            # Geospatial dispatch
│   │   │   ├── three-w.ts                    # 3W data management
│   │   │   └── use-rescue-hooks.ts           # React hooks
│   │   └── ui/
│   │       ├── RescueStatsBar.tsx            # Stats dashboard
│   │       ├── OperationsMap.tsx             # Multi-layer map
│   │       ├── SOSPanel.tsx                  # SOS management
│   │       ├── TaskBoard.tsx                 # Kanban board
│   │       ├── ResourceRegistry.tsx          # Resource management
│   │       ├── ThreeWDashboard.tsx           # Who-What-Where
│   │       ├── ShelterManager.tsx            # Shelter dashboard
│   │       ├── CommunicationHub.tsx          # Messaging
│   │       ├── IncidentTimeline.tsx          # Event log
│   │       ├── VolunteerManager.tsx          # Volunteer dashboard
│   │       ├── CheckInStatus.tsx             # Safety check-in
│   │       ├── DispatchAdvisor.tsx           # AI dispatch recommendations
│   │       ├── IncidentCommandBoard.tsx      # ICS org chart
│   │       └── ResourceFlow.tsx              # Sankey diagram
│   ├── alert-sos/                            # Phase 4 (existing)
│   ├── community-report/                     # Phase 3 (existing)
│   ├── map-disaster/                         # Phase 1 (existing)
│   └── predict/                              # Phase 2 (existing)
```

---

## Phần VII: Implementation Plan (28 Tasks, 8 Phases)

### Phase 5A: Foundation & Data Layer (Tasks 1-5)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 1 | `lib/types.ts` | TypeScript interfaces cho toàn bộ module | ~400 |
| 2 | `config/rescue-config.ts` | Configuration constants, color schemes, labels | ~250 |
| 3 | `api/mock-data.ts` | Mock data generator (15 incidents, 40 resources, 50 volunteers, 20 shelters) | ~600 |
| 4 | `npm install` | Install @turf/turf, @dnd-kit/core, @dnd-kit/sortable, d3-sankey | - |
| 5 | `lib/rescue-context.tsx` | React Context + useReducer + localStorage persistence | ~900 |

### Phase 5B: Core Engines (Tasks 6-9)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 6 | `lib/triage-engine.ts` | Priority scoring algorithm (4 factors weighted + START/SALT integration) | ~500 |
| 7 | `lib/dispatch-engine.ts` | Geospatial dispatch (Turf.js, best-fit algorithm) | ~600 |
| 8 | `lib/three-w.ts` | 3W data management (aggregate, filter, map layers, 5W extension) | ~400 |
| 9 | `lib/use-rescue-hooks.ts` | 14 React hooks (useIncidents, useSOS, useTasks, useResources, etc.) | ~700 |

### Phase 5C: Stats & Map (Tasks 10-11)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 10 | `ui/RescueStatsBar.tsx` | 8 animated stat cards, glassmorphism | ~400 |
| 11 | `ui/OperationsMap.tsx` | Multi-layer map (8 layers, toggle, popups, clustering) | ~700 |

### Phase 5D: Core Operations UI (Tasks 12-14)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 12 | `ui/SOSPanel.tsx` | SOS list, triage visualization, quick actions | ~600 |
| 13 | `ui/TaskBoard.tsx` | Kanban board (4 columns, drag & drop) | ~700 |
| 14 | `ui/ResourceRegistry.tsx` | Resource grid/table, CRUD, deploy/return | ~600 |

### Phase 5E: Coordination UI (Tasks 15-19)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 15 | `ui/ThreeWDashboard.tsx` | Split view: Map + Organization list | ~600 |
| 16 | `ui/ShelterManager.tsx` | Shelter cards, occupancy gauge, check-in | ~600 |
| 17 | `ui/CommunicationHub.tsx` | Discord-like chat, channels, broadcast | ~700 |
| 18 | `ui/IncidentTimeline.tsx` | Vertical timeline, event cards, filters | ~500 |
| 19 | `ui/VolunteerManager.tsx` | Volunteer list, skills search, assignment | ~600 |

### Phase 5F: Innovation UI (Tasks 20-23)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 20 | `ui/CheckInStatus.tsx` | Donut chart, missing persons, check-in form | ~600 |
| 21 | `ui/DispatchAdvisor.tsx` | Top 3 recommendations, score gauge, deploy | ~500 |
| 22 | `ui/IncidentCommandBoard.tsx` | ICS org chart, command transfer | ~500 |
| 23 | `ui/ResourceFlow.tsx` | Sankey diagram, resource allocation flow | ~400 |

### Phase 5G: Page Assembly (Tasks 24-26)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 24 | `app/rescue/page.tsx` | Main page (9 tabs, dynamic import, toast) | ~1000 |
| 25 | Navigation | Add /rescue link to homepage | ~20 |
| 26 | Build Verify | `npm run build` + testing all features | - |

### Phase 5H: Polish & Optimization (Tasks 27-28)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 27 | Performance | Lazy loading, marker clustering, virtual lists | ~200 |
| 28 | Documentation | Code comments, README updates | ~100 |

**Total Estimated:** ~11,000+ lines of code

---

## Phần VIII: Dependencies

```bash
npm install @turf/turf @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities d3-sankey
```

| Package | Purpose | Size |
|---------|---------|------|
| @turf/turf | Geospatial calculations (distance, area, nearest) | ~500KB (tree-shakeable) |
| @dnd-kit/core | Drag & drop framework | ~30KB |
| @dnd-kit/sortable | Sortable lists for Kanban | ~20KB |
| @dnd-kit/utilities | DnD utilities | ~10KB |
| d3-sankey | Sankey diagram for resource flow | ~15KB |

**Already installed (reuse):**
- Framer Motion (animations)
- Leaflet + react-leaflet (maps)
- Recharts (charts)
- lucide-react (icons)
- clsx (conditional classes)

---

## Phần IX: Design Tokens

### Colors

```
Incident Severity:   #EF4444 (critical), #F97316 (high), #EAB308 (medium), #22C55E (low)
SOS Priority:        #DC2626 (P1), #EA580C (P2), #CA8A04 (P3), #16A34A (P4)
Task Status:         #3B82F6 (new), #A855F7 (assigned), #F59E0B (in_progress), #22C55E (done)
Resource Status:     #22C55E (available), #3B82F6 (deployed), #F59E0B (returning), #6B7280 (maintenance)
Shelter Occupancy:   #22C55E (<50%), #EAB308 (50-80%), #F97316 (80-95%), #EF4444 (>95%)
Org Types:           #EF4444 (military), #DC2626 (vnrc), #3B82F6 (local_govt), #22C55E (volunteer), #A855F7 (ngo), #F59E0B (private)
Timeline Events:     #3B82F6 (incident), #22C55E (task), #F59E0B (resource), #EF4444 (sos), #6B7280 (system)
Communication:       #EF4444 (critical), #F97316 (urgent), #6B7280 (normal)
Triage Colors:       #EF4444 (red/immediate), #F59E0B (yellow/delayed), #22C55E (green/minor), #1F2937 (black/expectant)
```

### Typography

```
Stats Number:    text-2xl font-bold
Card Title:      text-sm font-semibold
Body Text:       text-xs text-slate-400
Badge:           text-[10px] font-medium
Timeline:        text-xs text-slate-300
```

### Animation

```
Stats counter:   spring, stiffness: 100, damping: 15
Card entrance:   0.3s ease, stagger 0.05s
Kanban drag:     spring, stiffness: 300, damping: 25
Layer toggle:    0.2s ease
SOS pulse:       2s infinite, scale 1→1.05
Message appear:  0.2s ease, slide up
Gauge fill:      0.8s ease-in-out
Timeline entry:  0.4s ease, slide from left
Donut chart:     1s ease-out, strokeDashoffset animation
```

---

## Phần X: Innovation Points (Thesis Impressiveness)

| # | Innovation | Reference | Uniqueness in Vietnam |
|---|-----------|-----------|----------------------|
| 1 | ICS-Based Incident Management | FEMA ICS | Lần đầu Việt hóa ICS cho web app |
| 2 | Geospatial Dispatch (Best-fit) | AVL + Turf.js | Không chỉ nearest, multi-factor scoring |
| 3 | 3W Dashboard (5W Extension) | UN OCHA | Lần đầu ứng dụng tại VN cho thiên tai |
| 4 | Priority Triage Engine (XAI-lite) | START + SALT | Auto-triage + giải thích tiếng Việt |
| 5 | Volunteer Lifecycle | IFRC Toolkit | Skills matching + certification |
| 6 | Shelter Management | IASC Cluster | Occupancy tracking + needs assessment |
| 7 | Communication Hub | WebEOC, D4H | Centralized thay vì Zalo groups |
| 8 | Incident Timeline | ICS Form 214 | Immutable audit trail |
| 9 | Safety Check-in | Safe & Well (ARC) | Auto missing persons list |
| 10 | Multi-agency Views | ICS Unified Command | Role-based: Military/VNRC/Govt/Volunteer |
| 11 | Kanban Task Board | Toyota Production System | Drag & drop cho rescue operations |
| 12 | Operations Map (8 layers) | COP (Common Operating Picture) | Multi-layer toggleable + clustering |
| 13 | Incident Command Board | ICS Org Chart | Visual command structure |
| 14 | Resource Flow Sankey | D3.js Sankey | Trực quan hóa phân bổ tài nguyên |
| 15 | Vietnamese Disaster Scenarios | Real events (Yagi 2024) | Mock data based on thực tế |
| 16 | Offline-first Architecture | Progressive Web App | localStorage + IndexedDB persistence |

---

## Phần XI: Scope Boundaries

### INCLUDED (trong scope)

- SOS request system with GPS + priority triage (START/SALT)
- Incident management with status lifecycle + ICS structure
- Kanban task board with drag & drop (@dnd-kit)
- Resource registry with CRUD + availability tracking
- Geospatial dispatch algorithm (Turf.js best-fit)
- Operations map with 8 toggleable layers + marker clustering
- 3W Dashboard (Who-What-Where) with 5W extension
- Volunteer lifecycle management with skills matching
- Shelter management with occupancy tracking + needs assessment
- Communication hub (per-incident channels + broadcast)
- Incident timeline (immutable audit trail)
- Check-in/safety status system with auto missing persons
- Dispatch advisor (AI recommendations - top 3)
- Incident command board (ICS org chart visualization)
- Resource flow Sankey diagram
- Responsive dark-themed UI (glassmorphism)
- localStorage + IndexedDB persistence
- Offline detection
- Mock data (realistic VN scenarios based on Yagi 2024)

### EXCLUDED (ngoài scope)

- Real-time WebSocket/SSE (localStorage-based for thesis)
- Real CRDT offline sync (demonstrate concept only)
- SMS/USSD integration (web-only)
- Real authentication (mock user roles)
- Push notifications (visual-only alerts)
- Model training / ML components
- Server-side rendering of rescue data
- 63 provinces (15 with complete data)
- Real API integrations (mock data only)
- Mobile native app (PWA concept only)
- Real satellite imagery integration
- Real drone data processing (ODM)

---

## Phần XII: Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| @turf/turf bundle size (~500KB) | Slow initial load | Dynamic import, tree-shake unused modules |
| @dnd-kit complexity | Drag bugs | Use SortableContext, test thoroughly |
| d3-sankey complexity | Rendering issues | Use react-sankey wrapper if needed |
| Too many UI components (14) | Long dev time | Reuse patterns from Phase 1-4, parallel development |
| Mock data too simple | Unrealistic demo | Base on real VN disaster scenarios (Yagi 2024) |
| Map layers overload | Performance lag | Canvas renderer, marker clustering, limit visible layers |
| Communication hub complexity | Scope creep | Simplified chat, no real-time (localStorage-based) |
| Mobile responsiveness | Broken layouts | Test each component on 375px viewport |
| localStorage size limits | Data loss | Use IndexedDB for large data (check-ins, messages) |
| 14 components too many | Context window overflow | Split into sub-phases, parallel development |

---

## Phần XIII: Execution Order

```
Phase 5A: Task 1 → 2 → 3 → 4 → 5          (Foundation)
Phase 5B: Task 6 → 7 → 8 → 9              (Engines)
Phase 5C: Task 10 → 11                     (Stats + Map)
Phase 5D: Task 12 → 13 → 14               (Core Operations)
Phase 5E: Task 15 → 16 → 17 → 18 → 19    (Coordination)
Phase 5F: Task 20 → 21 → 22 → 23          (Innovation)
Phase 5G: Task 24 → 25 → 26               (Assembly)
Phase 5H: Task 27 → 28                     (Polish)
```

**Parallel Opportunities:**
- Tasks 10-11 (Stats + Map)
- Tasks 12-14 (SOS + Task + Resource)
- Tasks 15-19 (all coordination UIs)
- Tasks 20-23 (all innovation UIs)

---

## Phần XIV: Code Conventions (Từ Phase 1-4)

### TypeScript
- Union literals (KHÔNG dùng enum): `type IncidentStatus = "new" | "active" | "resolved" | "closed"`
- PascalCase cho interfaces: `Incident`, `RescueTask`, `RescueResource`
- Props: `{ComponentName}Props` pattern, luôn có `className?: string`
- JSDoc tiếng Việt cho domain-specific types

### Config
- `Record<UnionType, { label, labelVi, icon, color, ... }>` pattern
- `as const` objects cho constants
- Bilingual labels (English + Vietnamese)

### State Management
- Context + useReducer (KHÔNG Redux/Zustand)
- `createInitialState()` factory function
- Discriminated union actions: `{ type: "ADD_INCIDENT"; payload: Incident }`
- `useCallback`/`useMemo` everywhere
- localStorage persistence

### Components
- `function ComponentName() {} export const ComponentName = memo(ComponentNameComponent)`
- Sub-components as local functions
- Framer Motion variants cho animations
- `AnimatePresence mode="wait"` cho tab switching

### UI
- Slate-950 dark theme, glassmorphism `backdrop-blur-xl`
- `rounded-xl` standard, `rounded-2xl` cho containers
- `text-lg font-bold text-white` cho titles
- `text-xs text-slate-500` cho descriptions
- Inline style cho dynamic colors từ config

### Map
- Dynamic import với `{ ssr: false }`
- `L.divIcon` custom markers trong `useEffect` với cleanup
- `useMap()` hook cho imperative control
- CartoDB dark tiles
- Canvas renderer cho performance

### File Organization
- Feature-sliced: `features/rescue/config/`, `lib/`, `ui/`, `api/`
- Thin page wrappers trong `src/app/`
- `import type { ... }` cho type-only imports
- `@/` path alias

---

## Phần XV: Verification Checklist

### Build & Runtime
- [ ] `npm run build` - zero errors
- [ ] `npm run dev` - http://localhost:3000/rescue loads
- [ ] All 9 tabs navigate correctly
- [ ] No console errors or warnings

### Core Features
- [ ] OperationsMap renders with all 8 toggleable layers
- [ ] SOS panel shows triage scores with START/SALT breakdown
- [ ] Task board drag & drop works across columns (@dnd-kit)
- [ ] Resource registry CRUD (add/edit/deploy/return)
- [ ] 3W dashboard shows organizations on map with 5W data
- [ ] Shelter occupancy gauges render correctly
- [ ] Communication hub messaging works
- [ ] Incident timeline shows chronological events
- [ ] Volunteer manager search by skills works
- [ ] Check-in status donut chart renders
- [ ] Dispatch advisor shows top 3 recommendations
- [ ] Incident command board shows ICS org chart
- [ ] Resource flow Sankey diagram renders

### Algorithms
- [ ] Triage engine calculates correct scores (START + SALT + custom)
- [ ] Dispatch engine returns best-fit (not just nearest)
- [ ] 3W aggregation groups by org type correctly
- [ ] Skills matching algorithm works for volunteers

### Performance
- [ ] Triage calculation < 50ms
- [ ] Dispatch calculation < 100ms
- [ ] Map render < 500ms
- [ ] No memory leaks (unmount cleanup)
- [ ] Marker clustering works with 100+ markers

### Quality
- [ ] Mobile responsive (375px viewport, no overflow)
- [ ] Console: no errors, no warnings
- [ ] Mock data renders for all 15 provinces
- [ ] Offline detection works (toggle network)
- [ ] Stats bar counters animate
- [ ] All config lookups have null-checks with fallbacks
- [ ] AnimatePresence for all modals/overlays (no early return)
- [ ] Keyboard accessible (Tab navigation, Enter to activate)

---

## Phần XVI: Tổng kết

Phase 5 - Module Phối Hợp Cứu Trợ là module **quan trọng nhất** của CứuNet:
- Biến hệ thống từ "giám sát" thành "hành động"
- **16 tính năng**, **14 UI components**, **28 tasks**, **8 sub-phases**
- **11,000+ lines** of code
- **16 innovation points** cho thesis
- Tham khảo **8 chuẩn quốc tế** (ICS, OCHA 3W/5W, START, SALT, IFRC, IASC, AVL, HXL)
- Dựa trên **4 case study** thực tế (Yagi 2024, Damrey 2017, Haiti 2010, Nepal 2015)
- **Việt hóa** hoàn toàn (tiếng Việt, đơn vị VN, tỉnh/thành phố VN)

**Sau Phase 5, CứuNet sẽ là:**
```
Map → Predict → Report → Alert → Rescue = COMPLETE WORKFLOW
(Bản đồ) (AI)    (Cộng đồng) (Cảnh báo) (Cứu hộ) = HỆ THỐNG HOÀN CHỈNH
```

**So sánh với hệ thống quốc tế:**
| Tính năng | Sahana Eden | Ushahidi | CứuNet Phase 5 |
|-----------|-------------|----------|----------------|
| Incident Management | ✅ | ❌ | ✅ ICS-based |
| Resource Tracking | ✅ | ❌ | ✅ + Dispatch AI |
| 3W Dashboard | ❌ | ❌ | ✅ + 5W extension |
| Triage Engine | ❌ | ❌ | ✅ START + SALT |
| Volunteer Lifecycle | ✅ | ❌ | ✅ + Skills matching |
| Shelter Management | ✅ | ❌ | ✅ + Occupancy gauge |
| Crowd-sourced Reports | ❌ | ✅ | ✅ (Phase 3) |
| Offline-first | Partial | ❌ | ✅ localStorage |
| Vietnamese Language | ❌ | ❌ | ✅ Native |
| Modern UI | ❌ | Partial | ✅ Dark glassmorphism |
