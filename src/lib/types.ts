export type DisasterType =
  | "flood"
  | "storm"
  | "landslide"
  | "drought"
  | "earthquake"
  | "tsunami";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type DisasterStatus = "active" | "monitoring" | "resolved";

export interface DisasterEvent {
  id: string;
  type: DisasterType;
  severity: SeverityLevel;
  status: DisasterStatus;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    province: string;
  };
  affectedPeople: number;
  startDate: string;
  updatedAt: string;
}

export interface SOSAlert {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "active" | "resolved" | "pending";
  message: string;
  timestamp: string;
  contactPhone?: string;
}

export interface Province {
  id: string;
  name: string;
  code: string;
  center: {
    lat: number;
    lng: number;
  };
  riskLevel: SeverityLevel;
  population: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: "heatmap" | "choropleth" | "markers" | "weather";
}

export interface FilterState {
  disasterTypes: DisasterType[];
  severityLevels: SeverityLevel[];
  status: DisasterStatus[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}
