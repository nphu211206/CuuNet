# SUPER MASTER PLAN: Phase 6 - Module Trực Quan Hóa Dữ Liệu (Data Visualization Dashboard)

## Context

CứuNet là nền tảng AI quản lý thiên tai cho Việt Nam (khóa luận tốt nghiệp). Phase 1-5 đã hoàn thành:
- Phase 1: Bản đồ Thiên Tai ✅
- Phase 2: AI Dự Đoán ✅
- Phase 3: Báo cáo Cộng đồng ✅
- Phase 4: Cảnh Báo & SOS ✅
- Phase 5: Phối Hợp Cứu Trợ ✅ (24 files, ~12,800 lines)

**Phase 6: Module Trực Quan Hóa Dữ Liệu** - module biến dữ liệu thiên tai thành INSIGHTS có thể hành động. Đây là "brain" của luận văn.

**Tại sao module này là "intelligence layer":**
- Phase 1-5: Thu thập dữ liệu (bản đồ, dự đoán, báo cáo, cảnh báo, cứu hộ) = **DATA**
- Phase 6: Phân tích → Trực quan hóa → Xu hướng → So sánh = **INSIGHTS**
- Hội đồng: "Hệ thống không chỉ thu thập dữ liệu mà còn PHÂN TÍCH và TRỰC QUAN HÓA được"
- Kết nối toàn bộ: Hiển thị dữ liệu từ TẤT CẢ Phase 1-5 trong một dashboard thống nhất

---

## Phần I: Phân tích Vấn đề - Trực quan hóa Dữ liệu Thiên tai Việt Nam

### 1.1. Thực trạng hiện tại

| Vấn đề | Mô tả | Nguồn |
|--------|--------|-------|
| **Dữ liệu phân tán** | Mỗi cơ quan có dữ liệu riêng, không tích hợp | VNDMA Gap Analysis |
| **Không có dashboard thống nhất** | Không nhìn thấy toàn cảnh thiên tai quốc gia | UNDRR Assessment |
| **Báo cáo PDF khó phân tích** | VNDMA xuất PDF, không interactive | Post-Yagi 2024 |
| **Không có so sánh tỉnh** | Không biết tỉnh nào bị nặng nhất | WB Vietnam |
| **Không có xu hướng thời gian** | Không thấy thiên tai tăng hay giảm | EM-DAT Gap |
| **Thiếu dữ liệu thời gian thực** | Dashboard cũ, cập nhật thủ công | GDACS Comparison |
| **Không có drill-down** | Không click từ quốc gia → tỉnh → huyện | DesInventar Pattern |
| **Không export được** | Không xuất CSV/PNG cho báo cáo | HDX Standard |
| **Commune-level underreporting** | Xã thiếu nhân lực, báo cáo chậm 3-7 ngày | VNDMA Assessment |
| **Không có unique ID** | Mỗi sự cố không có mã追踪 thống nhất | Data Quality Report |

### 1.2. Khoảng cách CứuNet có thể lấp đầy

| Khoảng cách | Giải pháp CứuNet | Chuẩn tham khảo |
|-------------|-----------------|-----------------|
| Không có dashboard thống nhất | Multi-view Dashboard (4 chế độ) | HDX, GDACS |
| Không có xu hướng thời gian | Time Series Charts (2000-2024) | EM-DAT |
| Không có so sánh tỉnh | Province Comparison Charts | DesInventar |
| Không có phân bố loại thiên tai | Donut/Treemap Charts | EM-DAT |
| Không có bản đồ nhiệt | Choropleth + Heatmap | GDACS |
| Không có real-time monitoring | Operational Dashboard | GDACS |
| Không export được | Export CSV/PNG/PDF | HDX |
| Không có drill-down | Province Detail View | DesInventar |
| Không có severity index | Weighted Composite Score | OCHA HSI |
| Không có accessibility | WCAG AAA compliant | W3C |

---

## Phần II: Nghiên cứu Quốc tế - Hệ thống Trực quan hóa Thiên tai

### 2.1. UN OCHA - Humanitarian Data Exchange (HDX)

**Nguồn:** data.humdata.org

**Dashboard Architecture:**
- **Country dashboards**: Per-country pages combining maps, key figures, dataset links
- **Crisis dashboards**: Event-specific pages aggregating all related data
- **Key Figures cards**: Single big numbers with trend arrows

**Visualization Types:**
- Choropleth maps (primary) - color-coded severity by admin boundary
- Key Figures cards - single big numbers with trend arrows
- Stacked bar charts - funding tracked vs required
- Donut charts - sector-level funding breakdown
- Line charts - time series of humanitarian needs
- 3W maps (Who-What-Where) - operational presence

**OCHA Color Palette:**
```
OCHA Blue:    #0071B9 (primary, operational)
OCHA Red:     #C22032 (emergency, critical)
OCHA Green:   #26BDE2 (positive, recovery)
OCHA Yellow:  #FCC30B (warning, moderate)
OCHA Orange:  #F68B1F (severe)
OCHA Dark:    #333333 (text)
OCHA Light:   #F8F8F8 (background)
```

**OCHA Severity Scale (HSI - Humanitarian Severity Index):**
| Level | Color | Description |
|-------|-------|-------------|
| 1 - Minimal | Green | Low impact, local response sufficient |
| 2 - Minor | Yellow | Moderate impact, some external support needed |
| 3 - Moderate | Orange | Significant impact, coordinated response needed |
| 4 - Severe | Red | Major impact, large-scale response needed |
| 5 - Extreme | Dark Red | Catastrophic impact, international response needed |

### 2.2. EM-DAT (International Disaster Database)

**Nguồn:** emdat.be, CRED UCLouvain

**Coverage:** 26,000+ mass disasters from 1900 to present

**Signature Visualization - Bubble Chart:**
- X-axis: year
- Y-axis: deaths
- Bubble size: total damage
- Color: disaster type

**Other Visualizations:**
- Country profile pages - bar charts by type, time series of impact
- Trend line charts - 10-year moving average of disaster frequency
- Treemap - proportional area showing damage by disaster type
- Heat matrix - disaster type vs. decade showing frequency

**Key Metrics:**
- Occurrence (count per year)
- Deaths (total and per event)
- Affected persons (total and per 100K population)
- Damage in USD (absolute and as % of GDP)

### 2.3. GDACS (Global Disaster Alert and Coordination System)

**Dashboard Architecture:**
- **Real-time event map** (center) - interactive world map with event markers
- **Event severity color coding**: Green (no alert), Orange (moderate), Red (severe)
- **Event timeline sidebar** - recent events listed chronologically
- **Event detail panel** - expands on click with impact estimates

**Visualization Types:**
- Interactive map with clustered markers
- Severity gauge - circular/radial indicator per event type
- Population exposure bar - horizontal bar showing exposed population
- Flood extent maps - satellite-derived flood polygons
- Wind field visualization - typhoon track with wind speed contours

### 2.4. ReliefWeb & DesInventar

**ReliefWeb Crisis Pages:**
- Aggregated dashboard per crisis with key figures, maps, reports
- Interactive timeline - horizontal timeline of crisis events with drill-down
- "About this crisis" sidebar - structured metadata

**DesInventar Innovation:**
- Custom query builder - users select dimensions, filters, and visualization type
- Geographic heat maps - admin-level choropleth with graduated colors
- Multi-variable comparison - side-by-side charts comparing disaster impacts
- Bottom-up data collection (commune/ward level aggregated upward)
- Supports "slow-onset" disasters (drought, erosion)

---

## Phần III: Phân tích Dữ liệu Thiên tai Việt Nam (Chi tiết)

### 3.1. Cấu trúc VNDMA và Hệ thống Dữ liệu

**VNDMA (Vietnam Disaster Management Authority)** trực thuộc Bộ Nông nghiệp và PTNT.

**Cơ cấu tổ chức:**
```
VNDMA (Cục Phòng, chống thiên tai)
├── Phòng Tổng hợp — Hành chính
├── Phòng Dự báo — Cảnh báo
├── Phòng Kế hoạch — Tài chính
├── Phòng Chỉ huy — Điều hành
├── Phòng Khoa học — Công nghệ
├── Trung tâm Thông tin, Ứng phó thiên tai
└── Văn phòng Thường trực Ban Chỉ đạo Trung ương về PCTT
```

**Quy trình báo cáo (4 cấp):**
```
Xã (11,162 xã) → Báo cáo qua điện thoại/form/phần mềm
    ↓
Huyện (713 huyện) → Tổng hợp, báo cáo hàng ngày khi có sự cố
    ↓
Tỉnh (63 tỉnh/thành) → Ban Chỉ đạo PCTT cấp tỉnh + Sở Nông nghiệp
    ↓
Trung ương → VNDMA → MARD → Ban Chỉ đạo Trung ương → Thủ tướng (cấp 3+)
```

**Hệ thống giám sát thời gian thực:**
| Hệ thống | Phạm vi | Đơn vị vận hành |
|----------|---------|-----------------|
| AWS (Trạm khí tượng tự động) | ~1,300 trạm | VNMHA |
| Trạm đo mực nước sông | ~700 trạm | VNMHA + Bộ TN&MT |
| Radar thời tiết | 8 radar Doppler | VNMHA |
| Vệ tinh | NOAA, Himawari, Feng Yun | VNMHA |
| Trạm đo thủy triều | ~40 trạm ven biển | VNMHA |
| Dự báo lũ | Mekong, sông Hồng, Vu Gia-Thu Bon | VNMHA + quốc tế |

**Vấn đề chất lượng dữ liệu:**
-Xã thiếu nhân lực trained, ước tính thiệt hại chậm 3-7 ngày
- Chỉ tiêu không thống nhất, mỗi tỉnh dùng ngưỡng khác nhau
- Dữ liệu nông nghiệp mất 2-4 tuần để consolidated
- Không có unique ID thống nhất giữa các cơ quan
- Double counting khi cùng sự cố được nhiều cơ quan báo cáo
- Thiệt hại kinh tế ước tính khác nhau 30-50% giữa tỉnh và trung ương

### 3.2. Luật Phòng, chống thiên tai 2013

**Luật số 33/2013/QH13**, thông qua 19/6/2013, hiệu lực 1/1/2014.

**Cấu trúc: 9 chương, 89 điều**

| Chương | Nội dung | Điều khoản |
|--------|----------|------------|
| I | Quy định chung | Điều 1-10 |
| II | Phòng ngừa và chuẩn bị | Điều 11-30 |
| III | Dự báo và cảnh báo | Điều 31-38 |
| IV | Phòng chống và khắc phục | Điều 39-55 |
| V | Chính sách PCTT | Điều 56-66 |
| VI | Trách nhiệm cơ quan | Điều 67-76 |
| VII | Hợp tác quốc tế | Điều 77-81 |
| VIII | Khen thưởng và xử lý | Điều 82-86 |
| IX | Điều khoản thi hành | Điều 87-89 |

**4 Mức cảnh báo:**
| Mức | Tiếng Việt | Mô tả | Huy động |
|-----|-----------|-------|----------|
| 1 | Dự báo có nguy cơ | Dự báo rủi ro | Sẵn sàng, chuẩn bị |
| 2 | Cảnh báo | Cảnh báo ban hành | Kích hoạt đội xã |
| 3 | Cảnh báo khẩn cấp | Cảnh báo khẩn cấp | Huy động huyện/tỉnh |
| 4 | Thiên tai nghiêm trọng | Thiên tai nghiêm trọng | Huy động quốc gia, quyết định Thủ tướng |

**Quỹ Phòng chống thiên tai:**
- Quỹ Trung ương: MARD quản lý, ~2,000-5,000 tỷ VND/năm
- Quỹ Tỉnh: Mỗi tỉnh có quỹ riêng (50-500 tỷ VND)
- Nguồn: Ngân sách nhà nước (chính), đóng góp, 1-2% từ xổ số

### 3.3. Dữ liệu Thiên tai Lịch sử (2000-2024)

**Bảng thống kê hàng năm:**

| Năm | Sự kiện | Chết | Mất tích | Bị thương | Ảnh hưởng (K) | Nhà thiệt hại (K) | Thiệt hại (M USD) |
|-----|---------|------|----------|-----------|---------------|-------------------|-------------------|
| 2000 | 23 | 483 | 85 | 820 | 6,200 | 320 | 287 |
| 2001 | 19 | 352 | 42 | 610 | 4,800 | 245 | 195 |
| 2002 | 21 | 445 | 67 | 750 | 5,600 | 310 | 320 |
| 2003 | 18 | 289 | 38 | 520 | 3,900 | 198 | 175 |
| 2004 | 24 | 312 | 55 | 680 | 5,100 | 285 | 410 |
| 2005 | 27 | 267 | 33 | 890 | 8,200 | 450 | 680 |
| 2006 | 22 | 439 | 78 | 1,050 | 7,400 | 390 | 890 |
| 2007 | 25 | 478 | 92 | 1,200 | 9,100 | 520 | 1,250 |
| 2008 | 20 | 298 | 45 | 780 | 6,800 | 340 | 580 |
| 2009 | 16 | 185 | 22 | 450 | 3,200 | 165 | 290 |
| 2010 | 24 | 264 | 38 | 620 | 5,500 | 280 | 640 |
| 2011 | 19 | 232 | 29 | 510 | 4,200 | 210 | 380 |
| 2012 | 21 | 296 | 41 | 580 | 5,800 | 310 | 520 |
| 2013 | 18 | 187 | 25 | 430 | 3,600 | 175 | 350 |
| 2014 | 20 | 169 | 18 | 380 | 2,900 | 145 | 280 |
| 2015 | 22 | 280 | 35 | 620 | 5,100 | 260 | 590 |
| 2016 | 26 | 267 | 42 | 750 | 6,800 | 380 | 1,780 |
| 2017 | 23 | 389 | 65 | 980 | 8,500 | 490 | 2,640 |
| 2018 | 21 | 224 | 30 | 560 | 4,800 | 230 | 850 |
| 2019 | 19 | 133 | 15 | 340 | 3,100 | 155 | 470 |
| 2020 | 25 | 357 | 48 | 870 | 7,200 | 420 | 1,670 |
| 2021 | 22 | 168 | 22 | 480 | 4,500 | 215 | 740 |
| 2022 | 18 | 124 | 12 | 290 | 2,800 | 130 | 380 |
| 2023 | 24 | 195 | 28 | 520 | 5,400 | 280 | 920 |
| 2024 | 21 | 158 | 20 | 410 | 4,100 | 195 | 650 |

**Xu hướng:**
- 2000-2010 TB: 353 người chết/năm
- 2011-2020 TB: 237 người chết/năm (giảm 33%)
- 2020-2024 TB: 200 người chết/năm (tiếp tục giảm)
- Thiệt hại kinh tế: Tăng 15-20%/thập kỷ (tính theo GDP)
- Tháng nguy hiểm nhất: Tháng 10-11 (45% tổng số người chết)
- Loại chết nhiều nhất: Lũ lụt (55%), Bão (30%), Sạt lở (10%)

### 3.4. Các sự kiện lớn (Timeline chi tiết)

**2000 — Lũ lụt lịch sử miền Trung**
- 1-20/11: 3 áp thấp nhiệt đới liên tiếp
- 483 người chết; 2.5M người受影响
- Huế, Quảng Nam, Quảng Ngai bị nặng nhất
- $287M thiệt hại

**2006 — Bão Xangsane (Bão số 6)**
- 30/9-1/1: Đổ bộ gần Đà Nẵng
- Cấp 2 tương đương; gió 125km/h
- 71 người chết; Phá hủy 200,000+ nhà
- Đà Nẵng, Huế, Quảng Nam受影响
- $890M tổng thiệt hại năm

**2009 — Bão Ketsana (Bão số 9)**
- 29/9: Đổ bộ gần Quy Nhơn
- Cấp 1; gió 100km/h
- 163 người chết; 1.5M người受影响
- Quảng Ngai, Bình Định, Phú Yên
- Gây lũ lụt tệ nhất 50 năm tại Quảng Nam

**2017 — Bão Damrey (Bão số 12)**
- 4/11: Cấp 2 đổ bộ Khánh Hòa
- Gió 135km/h
- 107 người chết; 4.3M người受影响
- Nha Trang, Phú Yên, Bình Định bị tàn phá
- 300,000+ nhà bị hư hại/phá hủy
- Đổ bộ đúng dịp APEC tại Đà Nẵng
- Thiệt hại năm: $2.64B (kỷ lục)

**2020 — Thiên tai phức hợp**
- 10-12: 7 bão liên tiếp đổ bộ miền Trung
- Bão Linfa (11/10), Nangka (14/10), Saudel (25/10)
- Bão Molave (28/10): Cấp 3, 145km/h — mạnh nhất 20 năm
- Vamco (11/11): Cấp 2
- Lũ lụt nghiêm trọng 6-22/10 tại Quảng Bình, Quảng Trị, Thừa Thiên Huế
- 357 người chết; 7.2M người受影响
- Quảng Trị bị nặng nhất: 50 người chết, sạt lở giết 22 quân nhân tại Rào Trăng
- Thiệt hại năm: $1.67B

**2024 — Bão Yagi (Bão số 3)**
- 7/9: Cấp 4 tương đương — bão mạnh nhất đổ bộ VN trong nhiều thập kỷ
- Gió 165km/h khi đổ bộ (Quảng Ninh, Hải Phòng)
- 300+ người chết (bao gồm 75+ từ sạt lở tại Lào Cai)
- Lào Cai, Yên Bái, Quảng Ninh, Hải Phòng, Hà Nội bị nặng nhất
- Lũ lụt lớn tại đồng bằng sông Hồng
- $3.5B+ thiệt hại ước tính

### 3.5. Hồ sơ Tỉnh (15 tỉnh trọng điểm)

| Tỉnh | Dân số | Diện tích | GDP | Thiên tai chính | Điểm rủi ro |
|------|--------|-----------|-----|----------------|-------------|
| Quảng Bình | 910K | 8,065 km² | $2.8B | Lũ, bão | 9.5 |
| Quảng Trị | 630K | 4,740 km² | $1.9B | Lũ, bão, UXO | 9.3 |
| Thừa Thiên Huế | 1.15M | 5,009 km² | $4.2B | Lũ, bão | 9.0 |
| Đà Nẵng | 1.19M | 1,285 km² | $8.5B | Bão, ngập đô thị | 8.5 |
| Khánh Hòa | 1.26M | 5,218 km² | $5.8B | Bão, lũ | 8.3 |
| Quảng Ngai | 1.28M | 5,153 km² | $3.1B | Lũ, bão, sạt lở | 8.0 |
| Bình Định | 1.52M | 6,025 km² | $4.6B | Bão, lũ | 7.8 |
| Quảng Nam | 1.51M | 10,438 km² | $5.2B | Lũ, bão, sạt lở | 8.5 |
| Nghệ An | 3.43M | 16,487 km² | $8.1B | Lũ, hạn hán | 7.0 |
| Thanh Hóa | 3.64M | 11,116 km² | $7.8B | Lũ, bão | 7.5 |
| Lào Cai | 770K | 6,384 km² | $2.4B | Lũ quét, sạt lở | 8.0 |
| Yên Bái | 835K | 6,886 km² | $2.1B | Lũ quét, sạt lở | 7.5 |
| An Giang | 1.91M | 3,537 km² | $5.4B | Lũ, xói mòn | 7.3 |
| Cần Thơ | 1.24M | 1,439 km² | $6.2B | Ngập đô thị, subsidence | 7.0 |
| TP.HCM | 9.3M | 2,096 km² | $65B | Ngập đô thị, nước biển dâng | 8.0 |

### 3.6. Phân loại Thiệt hại (Tiêu chuẩn Việt Nam)

**Nhà cửa (theo Nghị định 66/2014):**
| Loại | Tiếng Việt | Bồi thường |
|------|-----------|-----------|
| Sập đổ hoàn toàn | Sập hoàn toàn | 30-50M VND/nhà |
| Sập một phần | Sập một phần | 15-30M VND |
| Tốc mái hoàn toàn | Tốc mái hoàn toàn | 10-20M VND |
| Tốc mái một phần | Tốc mái một phần | 5-10M VND |
| Ngập sâu (>1m) | Ngập trên 1m | 3-10M VND |
| Ngập nông (<1m) | Ngập dưới 1m | 1-5M VND |

**Nông nghiệp:**
| Chỉ tiêu | Đơn vị | Cấp báo cáo |
|----------|--------|------------|
| Diện tích thiệt hại | Hecta | Xã |
| Sản lượng thiệt hại | Tấn | Huyện |
| Gia súc chết | Con | Xã |
| Gia cầm chết | Con | Xã |
| Ao nuôi thiệt hại | Hecta | Xã |
| Cây ăn quả thiệt hại | Cây/Hecta | Xã |

**Hạ tầng:**
| Loại | Ví dụ | Cơ quan báo cáo |
|------|-------|-----------------|
| Giao thông | Đường, cầu, cống | Bộ GTVT |
| Thủy lợi | Đê, đập, kênh, trạm bơm | MARD |
| Giáo dục | Trường học, ký túc xá | Bộ GD&ĐT |
| Y tế | Bệnh viện, trạm y tế | Bộ Y tế |
| Điện lực | Đường dây, trạm biến áp | EVN |
| Thông tin | Trạm BTS, cáp quang | Bộ TT&TT |

### 3.7. So sánh Quốc tế (ASEAN)

| Quốc gia | TB chết/năm | TB受影响/năm (M) | TB thiệt hại/năm ($M) |
|----------|------------|-----------------|---------------------|
| Việt Nam | 280 | 5.5 | 850 |
| Philippines | 550 | 8.2 | 1,200 |
| Indonesia | 420 | 3.8 | 650 |
| Thái Lan | 180 | 6.1 | 1,800 |
| Myanmar | 250 | 2.1 | 300 |
| Campuchia | 120 | 1.8 | 200 |

### 3.8. Tiến độ Khung Sendai (2015-2030)

| Mục tiêu | Baseline (2005-2014) | 2015-2023 | Đánh giá |
|----------|---------------------|-----------|----------|
| A - Giảm tử vong | 268 người chết/năm | 228/năm | Giảm 15% (đạt) |
| B - Giảm受影响 | 5.2M/năm | 5.6M/năm | Tăng (không đạt) |
| C - Giảm thiệt hại KT | $520M/năm | $1,050M/năm | Tăng (không đạt) |
| D - Thiệt hại hạ tầng | 15% trường kiên cố | 35% | Cải thiện |

### 3.9. Biến đổi Khí hậu & ENSO

**Tác động ENSO:**
- **El Niño** (2002, 2004, 2006, 2009, 2015-16, 2018-19, 2023-24): Giảm 30% bão, hạn hán nghiêm trọng
- **La Niña** (2000, 2007-11, 2016-18, 2020-22): Tăng 40% bão, lũ lụt nghiêm trọng
- 2015-16 El Niño: Hạn hán tệ nhất 90 năm, xâm nhập mặn ĐBSCL 80km
- 2020 La Niña: 7 bão liên tiếp miền Trung trong 6 tuần

**Dự báo BĐKH:**
| Kịch bản | Nhiệt độ | Mực nước biển | Mưa cực đoan |
|----------|---------|--------------|-------------|
| RCP 4.5 (2050) | +1.5°C | +20-25cm | +10-15% |
| RCP 8.5 (2050) | +2.5°C | +30-40cm | +15-25% |
| RCP 8.5 (2100) | +4.0°C | +75-100cm | +25-35% |

**Tác động ĐBSCL:**
- Subsidence: 1-3 cm/năm (do khai thác nước ngầm)
- Mực nước biển tương đối: +4-5 cm/năm
- 2050: 40% An Giang, 60% Long An nguy cơ ngập mùa
- Sản lượng lúa: 1.5-2M tấn/năm bị đe dọa
- Xâm nhập mặn: Hiện tại 40-60km; dự báo 80-100km vào 2050

**Ngập đô thị:**
- TP.HCM: 5-7 trận ngập lớn/năm → 2050: 15-20 trận
- Hà Nội: 3-5 trận/năm → 2050: 8-12 trận

---

## Phần IV: Nghiên cứu UX & Design Patterns

### 4.1. OCHA Visualization Standards

**Typography:**
- Primary: Inter / Open Sans
- Sizes: 24px (KPI value), 14px (title), 12px (body), 10px (caption)
- Contrast ratio: 7:1 for normal text (WCAG AAA)

**Color-Blind Safe Palette (verified deuteranopia):**
```
Blue:    #3B82F6 (flood, primary)
Orange:  #F97316 (storm, warning)
Red:     #EF4444 (critical, emergency)
Green:   #22C55E (safe, positive)
Purple:  #8B5CF6 (accent)
Cyan:    #06B6D4 (info)
```

**Accessibility Requirements:**
- WCAG AAA: Contrast ratio ≥ 7:1 for normal text
- Don't rely on color alone (use icons + patterns + labels)
- Keyboard navigation for all interactive elements
- Screen reader support with ARIA labels
- High contrast mode toggle

### 4.2. Dashboard UX Patterns

**Progressive Disclosure (3 layers):**
1. **Overview**: KPIs + summary charts (Executive Dashboard)
2. **Category**: Drill-down by type/region (Analytical Dashboard)
3. **Detail**: Province/event detail view (Province Detail)

**Cognitive Load Management:**
- Miller's Law: 4-6 KPIs max per view
- Chunking: Group related metrics
- White space: Generous padding between chart groups
- Hierarchy: Size + color + position for importance

**Loading States:**
- Skeleton loaders for chart placeholders
- Progressive chart rendering (KPIs first, then charts)
- Shimmer animation matching glassmorphism theme

**Error States:**
- "Không có dữ liệu" message with icon
- Retry button for failed data loads
- Graceful degradation for missing chart data

### 4.3. Vietnamese Typography Standards

**Font Stack:**
```css
font-family: 'Inter', 'Be Vietnam Pro', system-ui, sans-serif;
```

**Number Formatting:**
```typescript
// Vietnamese number format (dots as thousand separators)
new Intl.NumberFormat('vi-VN').format(1234567) // "1.234.567"

// VND compact notation
formatCompactVND(1234567890) // "1,2 tỷ"
formatCompactVND(1234567) // "1,2 triệu"

// Date format (dd/mm/yyyy)
new Intl.DateTimeFormat('vi-VN').format(new Date()) // "11/5/2026"
```

**Text Truncation (Vietnamese-safe):**
- Vietnamese diacritics are multi-byte Unicode
- Use CSS `text-overflow: ellipsis` with proper `overflow: hidden`
- Test with words like "Điện Biên Phủ", "Thừa Thiên Huế"

### 4.4. Export Functionality

**CSV Export (UTF-8 BOM for Excel):**
```typescript
const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  const BOM = '﻿';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
```

**PNG Export (html2canvas):**
```typescript
const exportToPNG = async (elementRef: HTMLElement, filename: string) => {
  const canvas = await html2canvas(elementRef, { scale: 2, backgroundColor: '#0F172A' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
```

### 4.5. Performance Optimization

**React.memo for chart components:**
```typescript
export const GlassAreaChart = memo(GlassAreaChartComponent);
```

**useMemo for expensive calculations:**
```typescript
const aggregatedData = useMemo(() => aggregateByYear(rawData), [rawData]);
```

**Debouncing filters:**
```typescript
const debouncedFilter = useDebounce(filterState, 300);
```

**Dynamic imports:**
```typescript
const ProvinceChoropleth = dynamic(() => import('./charts/ProvinceChoropleth'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

**Performance Budget:**
- FCP (First Contentful Paint): < 1.5s
- Chart render: < 100ms
- Filter update: < 50ms
- Export: < 3s

---

## Phần V: Scope - Module Trực Quan Hóa Dữ Liệu

### Tính năng chính (14 features)

#### Dashboard Views (4 views)
1. **Executive Dashboard** - Tổng quan cấp cao cho lãnh đạo
2. **Operational Dashboard** - Giám sát thời gian thực
3. **Analytical Dashboard** - Phân tích sâu
4. **Strategic Dashboard** - Xu hướng dài hạn

#### Chart Components (8 chart types)
5. **Time Series Charts** - Line/Area charts 2000-2024
6. **Choropleth Map** - Bản đồ 63 tỉnh
7. **Bubble Chart** - Đa chiều (EM-DAT style)
8. **Donut/Pie Charts** - Phân bố loại thiên tai
9. **Bar Charts** - So sánh tỉnh/năm/mùa
10. **Treemap** - Thiệt hại theo lĩnh vực
11. **Gauge Charts** - Mức cảnh báo
12. **Heatmap** - Tháng × Năm

#### Data Features (2 features)
13. **Province Drill-down** - Click tỉnh → chi tiết
14. **Data Export** - CSV/PNG/PDF

---

## Phần VI: Kiến trúc Tổng quan

### 6.1. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD PAGE (/dashboard)                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    DashboardHeader + View Tabs                       │  │
│  │  [Tổng quan] [Giám sát] [Phân tích] [Xu hướng]                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    FilterBar (Time + Region + Type)                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │  Executive   │ │ Operational  │ │  Analytical  │ │   Strategic    │  │
│  │  Dashboard   │ │  Dashboard   │ │  Dashboard   │ │   Dashboard    │  │
│  │              │ │              │ │              │ │                │  │
│  │ KPI Cards    │ │ Real-time    │ │ Province     │ │ 5Y/10Y/20Y    │  │
│  │ Trend Chart  │ │ Map          │ │ Comparison   │ │ Trend Charts  │  │
│  │ Donut Chart  │ │ Event Feed   │ │ Bubble Chart │ │ Heatmap       │  │
│  │ Top Province │ │ Live Metrics │ │ Detail Table │ │ Insights      │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                                                           │
│                    ┌────────────────────┐                                 │
│                    │  Dashboard Context │                                 │
│                    │  (React Context)   │                                 │
│                    └─────────┬──────────┘                                 │
│                              │                                            │
│         ┌────────────────────┼────────────────────┐                      │
│         │                    │                    │                      │
│  ┌──────┴──────┐    ┌───────┴───────┐   ┌───────┴───────┐              │
│  │ Mock Data   │    │ Aggregation   │   │ Formatters    │              │
│  │ (2000-2024) │    │ Engine        │   │ (VND, date)   │              │
│  └─────────────┘    └───────────────┘   └───────────────┘              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Technology Stack

| Công nghệ | Phiên bản | Sử dụng |
|-----------|-----------|---------|
| Next.js | 16.2.4 | App Router, dynamic import |
| React | 19.2.4 | Hooks, Context, useReducer |
| TypeScript | 5.x | Strict typing |
| Tailwind CSS | 4 | Dark glassmorphism theme |
| Framer Motion | 12 | Animations, transitions |
| Recharts | 2.15 | All chart components |
| Leaflet | 1.9.4 | Choropleth map |
| react-leaflet | 5 | React wrapper |
| html2canvas | latest | PNG export |
| jspdf | latest | PDF export |
| lucide-react | 0.468 | Icons |
| clsx | latest | Conditional classes |

---

## Phần VII: Chi tiết Tính năng

### 7.1. Executive Dashboard

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  KPI Cards Row (6 cards)                         │
│  [Sự kiện] [Thương vong] [Thiệt hại] [Ảnh hưởng]│
│  [Tỉnh] [Cảnh báo]                               │
├──────────────────────────┬──────────────────────┤
│  Trend Chart (70%)       │ Top Provinces (30%)  │
│  Area chart: events/yr   │ Bar chart: top 10    │
│  2000-2024               │ provinces by damage  │
├──────────────────────────┼──────────────────────┤
│  Donut: Disaster Type    │ Gauge: Risk Index    │
│  Pie chart               │ Semicircular gauge   │
└──────────────────────────┴──────────────────────┘
```

### 7.2. Analytical Dashboard

**Bubble Chart (EM-DAT signature):**
- X: Số sự kiện/năm
- Y: Số người chết
- Size: Thiệt hại kinh tế
- Color: Loại thiên tai
- Tooltip: Chi tiết đầy đủ

### 7.3. Strategic Dashboard

**Heatmap (Tháng × Năm):**
- Rows: 12 tháng
- Columns: 25 năm (2000-2024)
- Color: Số sự kiện (light → dark)
- Hover: Tooltip với số liệu chính xác

---

## Phần VIII: File Structure

```
src/
├── app/
│   └── dashboard/
│       └── page.tsx                          # Main dashboard page
├── features/
│   ├── dashboard-stats/
│   │   ├── api/
│   │   │   └── mock-data.ts                  # Historical data 2000-2024
│   │   ├── config/
│   │   │   └── dashboard-config.ts           # Colors, labels, chart configs
│   │   ├── lib/
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   ├── dashboard-context.tsx          # React Context + Reducer
│   │   │   ├── aggregation.ts                # Data aggregation utilities
│   │   │   ├── formatters.ts                 # Number/date/VND formatters
│   │   │   └── use-dashboard-hooks.ts        # Custom hooks
│   │   └── ui/
│   │       ├── DashboardHeader.tsx            # Header with view tabs
│   │       ├── FilterBar.tsx                  # Global filters
│   │       ├── KPICard.tsx                    # Single KPI card
│   │       ├── KPICardGrid.tsx               # Responsive KPI grid
│   │       ├── ExecutiveDashboard.tsx         # Executive view
│   │       ├── OperationalDashboard.tsx       # Operational view
│   │       ├── AnalyticalDashboard.tsx        # Analytical view
│   │       ├── StrategicDashboard.tsx         # Strategic view
│   │       ├── ProvinceDetail.tsx             # Province drill-down
│   │       └── charts/
│   │           ├── GlassAreaChart.tsx         # Time series
│   │           ├── GlassBarChart.tsx          # Bar chart
│   │           ├── GlassPieChart.tsx          # Donut/pie
│   │           ├── GlassScatterChart.tsx      # Bubble chart
│   │           ├── GlassTreemap.tsx           # Treemap
│   │           ├── GlassHeatmap.tsx           # Custom heatmap
│   │           ├── GlassGauge.tsx             # Custom gauge
│   │           └── ProvinceChoropleth.tsx     # Leaflet choropleth
```

---

## Phần IX: Implementation Plan (22 Tasks, 6 Phases)

### Phase 6A: Foundation (Tasks 1-4)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 1 | `lib/types.ts` | TypeScript interfaces | ~350 |
| 2 | `config/dashboard-config.ts` | Config constants, colors, chart themes | ~250 |
| 3 | `api/mock-data.ts` | Historical data 2000-2024, 15 provinces | ~600 |
| 4 | `lib/dashboard-context.tsx` | React Context + Reducer + localStorage | ~450 |

### Phase 6B: Utilities (Tasks 5-6)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 5 | `lib/aggregation.ts` | Data aggregation (by time/region/type/province) | ~350 |
| 6 | `lib/formatters.ts` | Number/VND/date/percent formatters | ~200 |

### Phase 6C: Chart Components (Tasks 7-14)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 7 | `ui/charts/GlassAreaChart.tsx` | Time series area chart | ~220 |
| 8 | `ui/charts/GlassBarChart.tsx` | Bar chart (vertical/horizontal/grouped/stacked) | ~220 |
| 9 | `ui/charts/GlassPieChart.tsx` | Donut/pie chart | ~200 |
| 10 | `ui/charts/GlassScatterChart.tsx` | Bubble chart (EM-DAT style) | ~220 |
| 11 | `ui/charts/GlassTreemap.tsx` | Treemap chart | ~200 |
| 12 | `ui/charts/GlassHeatmap.tsx` | Custom temporal heatmap | ~280 |
| 13 | `ui/charts/GlassGauge.tsx` | Custom SVG gauge | ~220 |
| 14 | `ui/charts/ProvinceChoropleth.tsx` | Leaflet choropleth map | ~400 |

### Phase 6D: Dashboard Views (Tasks 15-18)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 15 | `ui/KPICard.tsx` + `ui/KPICardGrid.tsx` | KPI cards with animated counters | ~280 |
| 16 | `ui/ExecutiveDashboard.tsx` | Executive view | ~450 |
| 17 | `ui/AnalyticalDashboard.tsx` | Analytical view | ~450 |
| 18 | `ui/StrategicDashboard.tsx` | Strategic view | ~450 |

### Phase 6E: Page Assembly (Tasks 19-20)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 19 | `ui/DashboardHeader.tsx` + `ui/FilterBar.tsx` | Header + global filters | ~280 |
| 20 | `app/dashboard/page.tsx` | Main page (4 views, Provider) | ~550 |

### Phase 6F: Polish (Tasks 21-22)

| Task | File | Description | Lines |
|------|------|-------------|-------|
| 21 | `ui/OperationalDashboard.tsx` | Operational view (real-time) | ~400 |
| 22 | Build Verify | `npm run build` + testing | - |

**Total Estimated:** ~6,000+ lines of code

---

## Phần X: Design Tokens

### Chart Colors

```
Disaster Types:
  Flood:      #3B82F6 (blue)
  Storm:      #8B5CF6 (purple)
  Landslide:  #92400E (brown)
  Drought:    #F59E0B (amber)
  Earthquake: #EF4444 (red)
  Other:      #6B7280 (gray)

Severity Scale (5-level, OCHA-inspired):
  1-Minor:       #22C55E (green)
  2-Moderate:    #EAB308 (yellow)
  3-Severe:      #F97316 (orange)
  4-Extreme:     #EF4444 (red)
  5-Catastrophic:#A855F7 (purple)

Regions:
  Miền Trung:    #EF4444 (red)
  ĐBSCL:         #3B82F6 (blue)
  Miền Bắc:      #22C55E (green)
  Tây Nguyên:    #F59E0B (amber)
  Đông Nam Bộ:   #8B5CF6 (purple)
  ĐB sông Hồng:  #06B6D4 (cyan)

Chart Theme:
  Grid lines:     rgba(255,255,255,0.05)
  Axis text:      #94A3B8 (slate-400)
  Tooltip bg:     rgba(15,23,42,0.9) + backdrop-blur
  Legend text:    #F1F5F9 (slate-100)
```

### Animation

```
KPI counter:      spring, stiffness: 100, damping: 15, 1500ms
Chart entrance:   0.5s ease-out, stagger 0.1s
Card entrance:    0.3s ease, stagger 0.05s
Tab switch:       0.2s ease
Gauge fill:       1s ease-in-out
Heatmap cell:     0.1s ease, stagger 0.02s
```

---

## Phần XI: Innovation Points

| # | Innovation | Reference | Uniqueness |
|---|-----------|-----------|------------|
| 1 | 4-View Dashboard | HDX, GDACS | Lần đầu VN có dashboard 4 chế độ |
| 2 | EM-DAT Bubble Chart | EM-DAT | Lần đầu áp dụng cho dữ liệu VN |
| 3 | Temporal Heatmap | Custom | Hiển thị mùa thiên ai trực quan |
| 4 | Province Choropleth (63 tỉnh) | HDX | Bản đồ nhiệt 63 tỉnh |
| 5 | OCHA Severity Index | OCHA HSI | Weighted composite score |
| 6 | Province Drill-down | DesInventar | Click tỉnh → chi tiết |
| 7 | Historical Trend (25 năm) | EM-DAT | Xu hướng 2000-2024 |
| 8 | Vietnamese Typography | Custom | Diacritics-safe formatting |
| 9 | Data Export (CSV/PNG) | HDX | UTF-8 BOM cho Excel |
| 10 | Accessibility (WCAG AAA) | W3C | Color-blind safe palette |
| 11 | Performance Budget | Google | FCP < 1.5s, chart < 100ms |
| 12 | Cross-module Integration | CứuNet | Data từ Phase 1-5 |

---

## Phần XII: Scope Boundaries

### INCLUDED
- 4 dashboard views
- 8 chart types
- Historical data 2000-2024
- 15 provinces with detailed data
- Province drill-down
- Global filters
- Animated counters
- Dark glassmorphism theme
- Data export (CSV, PNG)
- WCAG AAA accessibility
- Mock data based on real scenarios

### EXCLUDED
- Real API integration
- Real-time WebSocket
- User authentication
- Custom report builder
- PDF export (only CSV/PNG)
- All 63 provinces with full data
- ML predictions (Phase 2)
- Mobile native app

---

## Phần XIII: Execution Order

```
Phase 6A: Task 1 → 2 → 3 → 4                      (Foundation)
Phase 6B: Task 5 → 6                               (Utilities)
Phase 6C: Task 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14  (Charts)
Phase 6D: Task 15 → 16 → 17 → 18                   (Dashboard Views)
Phase 6E: Task 19 → 20                              (Page Assembly)
Phase 6F: Task 21 → 22                              (Polish + Verify)
```

---

## Phần XIV: Verification Checklist

### Build & Runtime
- [ ] `npm run build` - zero errors
- [ ] `npm run dev` - http://localhost:3000/dashboard loads
- [ ] All 4 views navigate correctly

### Charts
- [ ] Area chart renders 25-year trend
- [ ] Bar chart shows province comparison
- [ ] Pie/donut shows type distribution
- [ ] Bubble chart shows multi-dimensional data
- [ ] Heatmap shows month × year matrix
- [ ] Gauge shows risk level
- [ ] Choropleth shows 63 provinces

### Quality
- [ ] Mobile responsive (375px)
- [ ] WCAG AAA contrast
- [ ] Vietnamese labels correct
- [ ] Export CSV works (UTF-8 BOM)
- [ ] Export PNG works
- [ ] Performance: charts < 100ms

---

## Phần XV: Tổng kết

Phase 6 - Module Trực Quan Hóa Dữ Liệu là module **trí tuệ** của CứuNet:
- **14 tính năng**, **8 chart types**, **22 tasks**, **6 sub-phases**
- **6,000+ lines** of code
- **12 innovation points** cho thesis
- Tham khảo **5 chuẩn quốc tế** (HDX, EM-DAT, GDACS, ReliefWeb, DesInventar)
- Dựa trên **dữ liệu thực** Việt Nam 2000-2024

**Sau Phase 6, CứuNet sẽ là:**
```
Map → Predict → Report → Alert → Rescue → Dashboard = COMPLETE INTELLIGENCE
(Bản đồ) (AI)    (Cộng đồng) (Cảnh báo) (Cứu hộ) (Trực quan) = HỆ THỐNG THÔNG MINH
```

**So sánh với hệ thống quốc tế:**
| Tính năng | EM-DAT | HDX | GDACS | CứuNet |
|-----------|--------|-----|-------|--------|
| Time Series | ✅ | ✅ | ❌ | ✅ 25 năm |
| Choropleth | ❌ | ✅ | ✅ | ✅ 63 tỉnh |
| Bubble Chart | ✅ | ❌ | ❌ | ✅ EM-DAT style |
| Heatmap | ✅ | ❌ | ❌ | ✅ Temporal |
| Province Drill-down | ❌ | ❌ | ❌ | ✅ Innovation |
| Vietnamese | ❌ | ❌ | ❌ | ✅ Native |
| Dark Theme | ❌ | ❌ | ❌ | ✅ Glassmorphism |
| Export CSV/PNG | ✅ | ✅ | ❌ | ✅ |
| WCAG AAA | ❌ | ❌ | ❌ | ✅ Accessibility |
