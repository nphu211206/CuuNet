import type { DisasterType, SeverityLevel } from "@/lib/types";
import type {
  CommunityReport,
  ReportLocation,
  ReportPhoto,
  ReporterInfo,
  VerificationData,
  ReportStatus,
} from "./types";
import { REPORT_CONFIG } from "../config/report-config";

// === PROVINCE DATA ===

interface ProvinceInfo {
  lat: number;
  lng: number;
  districts: string[];
}

const PROVINCE_DATA: Record<string, ProvinceInfo> = {
  "Hà Nội": {
    lat: 21.0285,
    lng: 105.8542,
    districts: [
      "Hoàn Kiếm",
      "Ba Đình",
      "Đống Đa",
      "Hai Bà Trưng",
      "Thanh Xuân",
      "Long Biên",
      "Cầu Giấy",
      "Tây Hồ",
      "Hoàng Mai",
      "Nam Từ Liêm",
    ],
  },
  "Hồ Chí Minh": {
    lat: 10.8231,
    lng: 106.6297,
    districts: [
      "Quận 1",
      "Quận 3",
      "Quận 7",
      "Bình Thạnh",
      "Thủ Đức",
      "Tân Bình",
      "Gò Vấp",
      "Phú Nhuận",
      "Quận 2",
      "Quận 9",
    ],
  },
  "Đà Nẵng": {
    lat: 16.0748,
    lng: 108.223,
    districts: [
      "Hải Châu",
      "Thanh Khê",
      "Sơn Trà",
      "Ngũ Hành Sơn",
      "Liên Chiểu",
      "Cẩm Lệ",
      "Hòa Vang",
    ],
  },
  Huế: {
    lat: 16.4637,
    lng: 107.5909,
    districts: [
      "Thuận Hóa",
      "Phú Xuân",
      "Phong Điền",
      "Hương Thủy",
      "Hương Trà",
      "Quảng Điền",
      "Phú Vang",
    ],
  },
  "Cần Thơ": {
    lat: 10.0452,
    lng: 105.7469,
    districts: [
      "Ninh Kiều",
      "Bình Thủy",
      "Cái Răng",
      "Ô Môn",
      "Thốt Nốt",
      "Phong Điền",
      "Cờ Đỏ",
      "Vĩnh Thạnh",
    ],
  },
  "Hải Phòng": {
    lat: 20.8449,
    lng: 106.6881,
    districts: [
      "Hồng Bàng",
      "Lê Chân",
      "Ngô Quyền",
      "Kiến An",
      "Hải An",
      "Đồ Sơn",
      "Dương Kinh",
      "An Dương",
    ],
  },
  "Nha Trang": {
    lat: 12.2388,
    lng: 109.1967,
    districts: [
      "Vĩnh Hải",
      "Vĩnh Phước",
      "Phương Sài",
      "Phương Sơn",
      "Tân Lập",
      "Vĩnh Nguyên",
      "Phước Hải",
      "Vĩnh Thọ",
    ],
  },
  "Đà Lạt": {
    lat: 11.9404,
    lng: 108.4583,
    districts: [
      "Phường 1",
      "Phường 2",
      "Phường 3",
      "Phường 4",
      "Phường 5",
      "Phường 6",
      "Phường 7",
      "Phường 8",
      "Phường 9",
      "Phường 10",
      "Phường 11",
      "Phường 12",
    ],
  },
  "Quảng Bình": {
    lat: 17.4689,
    lng: 106.6223,
    districts: [
      "Đồng Hới",
      "Ba Đồn",
      "Quảng Trạch",
      "Bố Trạch",
      "Quảng Ninh",
      "Lệ Thủy",
      "Minh Hóa",
      "Tuyên Hóa",
    ],
  },
  "Quảng Nam": {
    lat: 15.8794,
    lng: 108.3353,
    districts: [
      "Tam Kỳ",
      "Hội An",
      "Đại Lộc",
      "Điện Bàn",
      "Duy Xuyên",
      "Thăng Bình",
      "Núi Thành",
      "Quế Sơn",
    ],
  },
  "Bến Tre": {
    lat: 10.2415,
    lng: 106.3759,
    districts: [
      "Bến Tre",
      "Châu Thành",
      "Chợ Lách",
      "Mỏ Cày Nam",
      "Giồng Trôm",
      "Bình Đại",
      "Ba Tri",
      "Thạnh Phú",
    ],
  },
  "Trà Vinh": {
    lat: 9.9513,
    lng: 106.3346,
    districts: [
      "Trà Vinh",
      "Càng Long",
      "Cầu Kè",
      "Tiểu Cần",
      "Châu Thành",
      "Trà Cú",
      "Duyên Hải",
      "Cầu Ngang",
    ],
  },
  "Lào Cai": {
    lat: 22.338,
    lng: 103.8447,
    districts: [
      "Lào Cai",
      "Sa Pa",
      "Bảo Thắng",
      "Bảo Yên",
      "Bát Xát",
      "Mường Khương",
      "Si Ma Cai",
      "Văn Bàn",
    ],
  },
  "Yên Bái": {
    lat: 21.7229,
    lng: 104.8722,
    districts: [
      "Yên Bái",
      "Nghĩa Lộ",
      "Lục Yên",
      "Văn Yên",
      "Trấn Yên",
      "Văn Chấn",
      "Mù Cang Chải",
      "Yên Bình",
    ],
  },
  "An Giang": {
    lat: 10.5216,
    lng: 105.1259,
    districts: [
      "Long Xuyên",
      "Châu Đốc",
      "Tân Châu",
      "Châu Phú",
      "Thoại Sơn",
      "Tri Tôn",
      "Tịnh Biên",
      "Chợ Mới",
    ],
  },
};

// === DESCRIPTION TEMPLATES ===

const DESCRIPTION_TEMPLATES: Record<DisasterType, string[]> = {
  flood: [
    "Mưa lớn kéo dài nhiều ngày liên tiếp, mực nước sông dâng cao vượt mức báo động. Nhiều khu vực ngập sâu 0.5-1.5m, giao thông tê liệt hoàn toàn. Người dân phải di tản đến nơi an toàn.",
    "Lũ quét đột ngột sau mưa lớn, nước từ thượng nguồn đổ về rất nhanh. Nhiều nhà dân bị ngập nặng, tài sản hư hại. Cần cứu hộ khẩn cấp cho các hộ gia đình bị cô lập.",
    "Triều cường dâng cao kết hợp mưa lớn gây ngập nặng tại khu vực trũng thấp. Nước ngập sâu vào nhà, nhiều hộ dân phải di chuyển lên tầng cao để tránh lũ.",
    "Sông dâng vượt mức báo động cấp 3, đê điều có nguy cơ vỡ. Chính quyền địa phương đang huy động lực lượng gia cố. Người dân cần cảnh giác cao độ.",
    "Ngập úng diện rộng do hệ thống thoát nước quá tải sau mưa lớn. Đường phố biến thành sông, xe cộ không thể di chuyển. Ảnh hưởng nghiêm trọng đến sinh hoạt.",
    "Nước lũ lên nhanh bất ngờ trong đêm, nhiều hộ dân không kịp di dời tài sản. Mực nước hiện tại cao hơn 1.5m so với bình thường. Cần hỗ trợ khẩn cấp.",
  ],
  storm: [
    "Bão đổ bộ với sức gió rất mạnh, giật cấp 12-13. Nhiều cây cối bị gãy đổ, nhà cửa hư hại nặng. Mái tôn bay khắp nơi, đường dây điện đứt.",
    "Giông lốc kèm mưa lớn xảy ra đột ngột, tốc mái nhiều nhà dân trong khu vực. Đường dây điện đứt gây mất điện diện rộng. Cần khắc phục khẩn cấp.",
    "Bão kèm theo mưa to gió lớn, sóng biển cao 3-5m đánh vào bờ dữ dội. Khu vực ven biển bị ảnh hưởng nặng nề, nhiều tàu thuyền bị hư hại.",
    "Áp thấp nhiệt đới mạnh lên thành bão, đổ bộ vào khu vực với sức gió cấp 10-11. Nhiều công trình bị hư hại, cây cối gãy đổ khắp nơi.",
    "Bão số đổ bộ gây thiệt hại nghiêm trọng. Gió mạnh cuốn bay mái tôn, tốc mái nhiều nhà dân. Mưa lớn gây ngập úng nhiều nơi.",
  ],
  landslide: [
    "Sạt lở đất nghiêm trọng do mưa lớn kéo dài, khối lượng đất đá lớn tràn xuống đường. Cô lập nhiều thôn bản, có người bị mắc kẹt cần cứu hộ.",
    "Taluy âm sạt lở cắt đứt tuyến đường chính, giao thông bị chia cắt hoàn toàn. Nhiều hộ dân sống ven đồi núi phải di tản khẩn cấp.",
    "Đất đá từ triền núi sạt lở vùi lấp nhà dân, lực lượng cứu hộ đang tìm kiếm người mất tích. Tình hình rất nghiêm trọng, cần hỗ trợ khẩn cấp.",
    "Mưa lớn làm đất bão hòa, sạt lở xảy ra tại nhiều điểm trên tuyến đường. Xe cộ không thể qua lại, nhiều thôn bản bị cô lập.",
    "Sạt lở đất kinh hoàng sau mưa bão, nhiều ngôi nhà bị vùi lấp hoàn toàn. Chính quyền đang huy động lực lượng cứu hộ tìm kiếm nạn nhân.",
  ],
  drought: [
    "Hạn hán kéo dài nhiều tháng, nước giếng khô cạn, đồng ruộng nứt nẻ. Nông dân mất trắng vụ mùa, thiếu nước sinh hoạt nghiêm trọng.",
    "Xâm nhập mặn sâu vào nội đồng, độ mặn vượt ngưỡng cho phép. Vườn cây ăn trái chết hàng loạt, thiệt hại kinh tế rất lớn.",
    "Thiếu nước sinh hoạt trầm trọng, nhiều hộ dân phải mua nước với giá cao. Hồ chứa nước chỉ còn dưới 20% dung tích.",
    "Nắng nóng gay gắt trên 40°C kéo dài nhiều ngày, ảnh hưởng nghiêm trọng đến sức khỏe người già và trẻ em. Thiếu nước uống trầm trọng.",
    "Mùa khô khắc nghiệt, nguồn nước sạch cạn kiệt. Nông nghiệp thiệt hại nặng nề, nhiều diện tích lúa bị mất trắng.",
  ],
  earthquake: [
    "Động đất xảy ra với cường độ mạnh, rung chấn lan rộng khắp khu vực. Nhiều tòa nhà xuất hiện vết nứt, người dân hoảng loạn chạy ra đường.",
    "Run chấn từ trận động đất làm đồ vật rơi vỡ, tường nhà xuất hiện vết nứt. Người dân lo lắng, không dám vào nhà.",
    "Động đất xảy ra đột ngột, cảm nhận rõ rung lắc tại tầng cao. Một số công trình bị hư hại nhẹ, cần kiểm tra an toàn.",
    "Trận động đất mạnh làm rung chuyển cả khu vực, nhiều người dân hoảng sợ. Cần kiểm tra structural integrity của các tòa nhà.",
  ],
  tsunami: [
    "Sóng thần cao ập vào bờ biển sau trận động đất. Nước biển dâng nhanh bất thường, tràn sâu vào đất liền.",
    "Cảnh báo sóng thần sau động đất, người dân ven biển đang di tản khẩn cấp lên vùng cao. Tình hình rất cấp bách.",
    "Sóng biển cao bất thường tấn công bờ biển, nhiều du khách và ngư dân bị ảnh hưởng. Lực lượng cứu hộ đang triển khai.",
  ],
};

// === TITLE TEMPLATES ===

const TITLE_TEMPLATES: Record<DisasterType, string[]> = {
  flood: [
    "Lũ lụt nghiêm trọng tại {district}",
    "Ngập lụt diện rộng ở {province}",
    "Lũ quét bất ngờ tại {district}",
    "Triều cường ngập nặng {province}",
    "Sông dâng cao, ngập sâu {district}",
    "Ngập úng sau mưa lớn tại {district}",
    "Nước lũ lên nhanh ở {province}",
  ],
  storm: [
    "Bão đổ bộ {province}",
    "Giông lốc mạnh tại {district}",
    "Bão kèm mưa lớn ở {province}",
    "Lốc xoáy tốc mái {district}",
    "Bão gây thiệt hại nặng tại {district}",
    "Giông bão phá hủy {province}",
  ],
  landslide: [
    "Sạt lở đất nghiêm trọng tại {district}",
    "Sạt lở cắt đứt đường ở {province}",
    "Đất trùm nhà dân tại {district}",
    "Sạt lở taluy âm ở {province}",
    "Lở đất cô lập thôn bản {district}",
    "Sạt lở sau mưa bão tại {province}",
  ],
  drought: [
    "Hạn hán nghiêm trọng tại {province}",
    "Xâm nhập mặn sâu ở {district}",
    "Thiếu nước sinh hoạt tại {province}",
    "Nắng nóng gay gắt {district}",
    "Hạn hán phá hủy mùa màng {province}",
    "Khô hạn kéo dài tại {district}",
  ],
  earthquake: [
    "Động đất tại {province}",
    "Run chấn mạnh felt tại {district}",
    "Động đất làm nứt nhà ở {province}",
    "Động đất rung chuyển {district}",
  ],
  tsunami: [
    "Sóng thần tấn công bờ biển {province}",
    "Cảnh báo sóng thần tại {district}",
    "Sóng biển cao bất thường ở {province}",
    "Sóng thần đe dọa {district}",
  ],
};

// === REPORTER NAMES ===

const VIETNAMESE_NAMES = [
  "Nguyễn Văn An",
  "Trần Thị Bình",
  "Lê Văn Cường",
  "Phạm Thị Dung",
  "Hoàng Văn Em",
  "Vũ Thị Phượng",
  "Đặng Văn Giang",
  "Bùi Thị Hoa",
  "Ngô Văn Inh",
  "Lý Thị Kim",
  "Trịnh Văn Long",
  "Đỗ Thị Mai",
  "Nguyễn Văn Nam",
  "Trần Thị Oanh",
  "Lê Văn Phúc",
  "Phạm Thị Quỳnh",
  "Hoàng Văn Sơn",
  "Vũ Thị Trang",
  "Đặng Văn Tùng",
  "Bùi Thị Vân",
  "Ngô Văn Vũ",
  "Lý Thị Xuân",
  "Trịnh Văn Dương",
  "Đỗ Thị Hạnh",
  "Nguyễn Văn Khánh",
  "Trần Thị Lan",
  "Lê Văn Minh",
  "Phạm Thị Ngọc",
  "Hoàng Văn Phát",
  "Vũ Thị Quyên",
];

// === HELPER FUNCTIONS ===

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function weightedRandom<T>(distribution: [T, number][]): T {
  const rand = Math.random();
  let cumulative = 0;
  for (const [item, weight] of distribution) {
    cumulative += weight;
    if (rand <= cumulative) return item;
  }
  return distribution[distribution.length - 1][0];
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateTimestamp(daysBack: number): string {
  const now = Date.now();
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

// === LOCATION GENERATOR ===

function generateLocation(province: string, district: string): ReportLocation {
  const data = PROVINCE_DATA[province];
  if (!data) {
    return {
      lat: 14.0583 + randomFloat(-2, 2),
      lng: 108.2772 + randomFloat(-2, 2),
      province,
      district,
      address: `${district}, ${province}`,
    };
  }

  // Add small random offset to province center
  const lat = data.lat + randomFloat(-0.15, 0.15);
  const lng = data.lng + randomFloat(-0.15, 0.15);

  const streets = [
    "Đường Lê Lợi",
    "Đường Nguyễn Huệ",
    "Đường Trần Hưng Đạo",
    "Đường Hùng Vương",
    "Đường Phạm Văn Đồng",
    "Đường Võ Nguyên Giáp",
    "Đường Trường Chinh",
    "Đường Cách Mạng Tháng 8",
  ];

  const street = randomItem(streets);
  const number = randomInt(1, 200);

  return {
    lat: Math.round(lat * 10000) / 10000,
    lng: Math.round(lng * 10000) / 10000,
    province,
    district,
    address: `${number} ${street}, ${district}, ${province}`,
    accuracy: randomInt(5, 50),
  };
}

// === VERIFICATION GENERATOR ===

function generateVerification(status: ReportStatus): VerificationData {
  let upvotes: number;
  let downvotes: number;

  switch (status) {
    case "verified":
      upvotes = randomInt(5, 25);
      downvotes = randomInt(0, 3);
      break;
    case "resolved":
      upvotes = randomInt(3, 15);
      downvotes = randomInt(0, 2);
      break;
    case "rejected":
      upvotes = randomInt(0, 3);
      downvotes = randomInt(5, 20);
      break;
    default: // pending
      upvotes = randomInt(0, 5);
      downvotes = randomInt(0, 2);
  }

  const total = upvotes + downvotes;
  const trustScore =
    total === 0
      ? 0.5
      : Math.max(
          0,
          Math.min(1, 0.5 + ((upvotes - downvotes) / total) * 0.5)
        );

  const voterIds: string[] = [];
  for (let i = 0; i < total; i++) {
    voterIds.push(generateUUID());
  }

  const badge =
    status === "verified"
      ? "verified"
      : status === "rejected"
        ? "disputed"
        : null;

  const now = new Date().toISOString();

  return {
    upvotes,
    downvotes,
    trustScore: Math.round(trustScore * 100) / 100,
    voterIds,
    badge: badge as "verified" | "disputed" | null,
    verifiedAt: badge ? now : undefined,
    lastVoteAt: total > 0 ? generateTimestamp(7) : undefined,
  };
}

// === REPORTER GENERATOR ===

function generateReporter(): ReporterInfo {
  const isAnonymous = Math.random() < 0.6; // 60% anonymous
  const name = isAnonymous ? "" : randomItem(VIETNAMESE_NAMES);
  const phone = isAnonymous
    ? ""
    : Math.random() < 0.5
      ? `09${randomInt(10000000, 99999999)}`
      : "";

  return {
    id: generateUUID(),
    name,
    phone,
    isAnonymous,
    reportCount: randomInt(1, 15),
    avgTrustScore: randomFloat(0.3, 0.9),
    joinedAt: generateTimestamp(90),
  };
}

// === PHOTO GENERATOR ===

function generatePhotos(count: number): ReportPhoto[] {
  const photos: ReportPhoto[] = [];

  // Placeholder gradient images (generated via CSS in the UI)
  const placeholderColors = [
    ["#1e3a5f", "#0f172a"],
    ["#3b2f1e", "#1a0f05"],
    ["#1e3b2f", "#0a1f15"],
    ["#3b1e2f", "#1f0515"],
    ["#2f1e3b", "#150a1f"],
  ];

  for (let i = 0; i < count; i++) {
    const colors = placeholderColors[i % placeholderColors.length];
    const originalSize = randomInt(500_000, 5_000_000);
    const compressedSize = Math.round(originalSize * randomFloat(0.15, 0.4));

    photos.push({
      id: generateUUID(),
      data: `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
          <defs>
            <linearGradient id="g${i}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:${colors[0]}"/>
              <stop offset="100%" style="stop-color:${colors[1]}"/>
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#g${i})"/>
          <text x="200" y="150" text-anchor="middle" fill="#64748b" font-size="16" font-family="sans-serif">
            📷 Ảnh ${i + 1}
          </text>
        </svg>`
      )}`,
      thumbnail: `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="${colors[0]}"/>
          <text x="100" y="100" text-anchor="middle" fill="#64748b" font-size="12" font-family="sans-serif">
            📷
          </text>
        </svg>`
      )}`,
      originalSize,
      compressedSize,
      width: 400,
      height: 300,
      caption: "",
      uploadedAt: generateTimestamp(30),
    });
  }

  return photos;
}

// === TITLE GENERATOR ===

function generateTitle(
  type: DisasterType,
  province: string,
  district: string
): string {
  const templates = TITLE_TEMPLATES[type] || TITLE_TEMPLATES.flood;
  const template = randomItem(templates);
  return template
    .replace("{province}", province)
    .replace("{district}", district);
}

// === DESCRIPTION GENERATOR ===

function generateDescription(type: DisasterType): string {
  const templates = DESCRIPTION_TEMPLATES[type] || DESCRIPTION_TEMPLATES.flood;
  return randomItem(templates);
}

// === PROVINCE/DISTRICT HELPERS ===

function randomProvince(): string {
  return randomItem(Object.keys(PROVINCE_DATA));
}

function randomDistrict(province: string): string {
  const data = PROVINCE_DATA[province];
  if (!data) return "Trung tâm";
  return randomItem(data.districts);
}

// === MAIN GENERATOR ===

export function generateMockReports(
  count: number = REPORT_CONFIG.MOCK_REPORT_COUNT
): CommunityReport[] {
  const reports: CommunityReport[] = [];

  // Distribution ratios
  const typeDistribution: [DisasterType, number][] = [
    ["flood", 0.35],
    ["storm", 0.20],
    ["landslide", 0.15],
    ["drought", 0.12],
    ["earthquake", 0.10],
    ["tsunami", 0.08],
  ];

  const statusDistribution: [ReportStatus, number][] = [
    ["pending", 0.45],
    ["verified", 0.30],
    ["resolved", 0.18],
    ["rejected", 0.07],
  ];

  const severityDistribution: [SeverityLevel, number][] = [
    ["critical", 0.15],
    ["high", 0.30],
    ["medium", 0.35],
    ["low", 0.20],
  ];

  for (let i = 0; i < count; i++) {
    const type = weightedRandom(typeDistribution);
    const status = weightedRandom(statusDistribution);
    const severity = weightedRandom(severityDistribution);
    const province = randomProvince();
    const district = randomDistrict(province);

    const createdAt = generateTimestamp(30);
    const updatedAt = new Date(
      new Date(createdAt).getTime() + randomInt(0, 3600000)
    ).toISOString();

    const location = generateLocation(province, district);
    const verification = generateVerification(status);
    const reporter = generateReporter();
    const photoCount = randomInt(0, 3);
    const photos = generatePhotos(photoCount);

    reports.push({
      id: generateUUID(),
      type,
      severity,
      status,
      location,
      title: generateTitle(type, province, district),
      description: generateDescription(type),
      photos,
      reporter,
      verification,
      createdAt,
      updatedAt,
      isOffline: false,
      syncStatus: "synced",
      reportNumber: i + 1,
    });
  }

  // Sort by createdAt descending (newest first)
  reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Re-number after sorting
  reports.forEach((report, index) => {
    report.reportNumber = index + 1;
  });

  return reports;
}

// === PROVINCE HELPERS (exported) ===

export function getProvinceNames(): string[] {
  return Object.keys(PROVINCE_DATA);
}

export function getDistrictsForProvince(province: string): string[] {
  return PROVINCE_DATA[province]?.districts ?? [];
}

export function getProvinceCenter(
  province: string
): { lat: number; lng: number } | null {
  const data = PROVINCE_DATA[province];
  if (!data) return null;
  return { lat: data.lat, lng: data.lng };
}

export function isValidProvince(province: string): boolean {
  return province in PROVINCE_DATA;
}

export function isValidDistrict(
  province: string,
  district: string
): boolean {
  return PROVINCE_DATA[province]?.districts.includes(district) ?? false;
}

// === SINGLE REPORT GENERATOR (for simulated real-time) ===

export function generateSingleReport(): CommunityReport {
  const typeDistribution: [DisasterType, number][] = [
    ["flood", 0.35],
    ["storm", 0.20],
    ["landslide", 0.15],
    ["drought", 0.12],
    ["earthquake", 0.10],
    ["tsunami", 0.08],
  ];

  const severityDistribution: [SeverityLevel, number][] = [
    ["critical", 0.15],
    ["high", 0.30],
    ["medium", 0.35],
    ["low", 0.20],
  ];

  const type = weightedRandom(typeDistribution);
  const severity = weightedRandom(severityDistribution);
  const province = randomProvince();
  const district = randomDistrict(province);

  return {
    id: generateUUID(),
    type,
    severity,
    status: "pending",
    location: generateLocation(province, district),
    title: generateTitle(type, province, district),
    description: generateDescription(type),
    photos: generatePhotos(randomInt(0, 2)),
    reporter: generateReporter(),
    verification: {
      upvotes: 0,
      downvotes: 0,
      trustScore: 0.5,
      voterIds: [],
      badge: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isOffline: false,
    syncStatus: "synced",
    reportNumber: 0,
  };
}
