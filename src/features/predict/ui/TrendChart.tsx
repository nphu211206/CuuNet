"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { TrendChartProps, TimeSeriesPoint } from "../lib/types";
import { CHART_COLORS, DISASTER_CONFIG } from "../config/predict-config";
import type { DisasterType } from "@/lib/types";

// === CUSTOM TOOLTIP ===

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  payload: ChartDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const isPrediction = data.isPrediction;

  return (
    <div className="glass-card px-4 py-3 border border-slate-700/50 shadow-xl min-w-[180px]">
      <p className="text-sm font-semibold text-slate-200 mb-2 border-b border-slate-700/50 pb-2">
        {label}
        {isPrediction && (
          <span className="ml-2 text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
            Dự đoán
          </span>
        )}
      </p>

      {data.actual !== undefined && data.actual !== null && (
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-400">Thực tế:</span>
          </span>
          <span className="font-mono text-green-400">
            {(data.actual * 100).toFixed(1)}%
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-400">Dự đoán:</span>
        </span>
        <span className="font-mono text-blue-400">
          {(data.predicted * 100).toFixed(1)}%
        </span>
      </div>

      {data.lower !== undefined && data.upper !== undefined && (
        <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-slate-700/50">
          <span className="text-slate-500">Khoảng tin cậy:</span>
          <span className="font-mono text-slate-400">
            {(data.lower * 100).toFixed(0)}% - {(data.upper * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// === CUSTOM LEGEND ===

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string; type: string }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
          {entry.type === "line" ? (
            <span
              className="w-4 h-0.5 rounded"
              style={{
                backgroundColor: entry.color,
                borderStyle: entry.value.includes("Dự đoán") ? "dashed" : "solid",
              }}
            />
          ) : (
            <span className="w-3 h-3 rounded opacity-40" style={{ backgroundColor: entry.color }} />
          )}
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// === DATA TRANSFORMATION ===

interface ChartDataPoint {
  month: string;
  actual?: number;
  predicted: number;
  lower: number;
  upper: number;
  isPrediction: boolean;
}

/**
 * Build chart data from TimeSeriesPoint[].
 * Points with `actual` are historical; points without are predictions.
 */
function buildChartData(points: TimeSeriesPoint[]): ChartDataPoint[] {
  return points.map((point) => ({
    month: point.month,
    actual: point.actual,
    predicted: point.predicted,
    lower: point.lower,
    upper: point.upper,
    isPrediction: point.actual === undefined || point.actual === null,
  }));
}

// === COMPONENT ===

export default function TrendChart({
  data,
  disasterType,
  height = 300,
  showConfidence = true,
}: TrendChartProps) {
  const config = DISASTER_CONFIG[disasterType];
  const typeColor = config?.color ?? "#3B82F6";

  const chartData = useMemo(
    () => buildChartData(data),
    [data]
  );

  // Find the boundary between historical and prediction
  const predictionStartIndex = chartData.findIndex((d) => d.isPrediction);

  if (chartData.length === 0) {
    return (
      <div
        className="glass-card flex items-center justify-center text-slate-500"
        style={{ height }}
      >
        <p className="text-sm">Không có dữ liệu để hiển thị</p>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config?.icon}</span>
          <h3 className="text-sm font-semibold text-slate-200">
            Xu hướng {config?.label ?? disasterType}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Lịch sử
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColor }} />
            Dự đoán
          </span>
          {showConfidence && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500/30" />
              95% TC
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            {/* Confidence band gradient */}
            <linearGradient id={`confidence-${disasterType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={typeColor} stopOpacity={0.2} />
              <stop offset="50%" stopColor={typeColor} stopOpacity={0.08} />
              <stop offset="95%" stopColor={typeColor} stopOpacity={0} />
            </linearGradient>
            {/* Prediction line gradient */}
            <linearGradient id={`pred-line-${disasterType}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="40%" stopColor="#22C55E" />
              <stop offset="41%" stopColor={typeColor} />
              <stop offset="100%" stopColor={typeColor} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[0, 1]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tickCount={5}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Reference line at prediction boundary */}
          {predictionStartIndex > 0 && (
            <ReferenceLine
              x={chartData[predictionStartIndex]?.month}
              stroke="#475569"
              strokeDasharray="4 4"
              label={{
                value: "Dự đoán",
                position: "top",
                fill: "#64748b",
                fontSize: 10,
              }}
            />
          )}

          {/* Reference line at 0.6 (high risk threshold) */}
          <ReferenceLine
            y={0.6}
            stroke="#F97316"
            strokeDasharray="8 4"
            strokeOpacity={0.3}
          />

          {/* Confidence band (upper) */}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill={`url(#confidence-${disasterType})`}
              fillOpacity={1}
              isAnimationActive={false}
            />
          )}

          {/* Confidence band (lower) - fills to bottom */}
          {showConfidence && (
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#0B0D17"
              fillOpacity={0.8}
              isAnimationActive={false}
            />
          )}

          {/* Actual historical line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={(props: any) => {
              const { cx, cy, index } = props;
              if (chartData[index]?.isPrediction) return <></>;
              return (
                <circle
                  key={`actual-${index}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#22C55E"
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{
              r: 5,
              fill: "#22C55E",
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
            connectNulls={false}
            isAnimationActive={true}
            animationDuration={800}
          />

          {/* Prediction line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke={typeColor}
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={(props: any) => {
              const { cx, cy, index } = props;
              if (!chartData[index]?.isPrediction) return <></>;
              return (
                <circle
                  key={`pred-${index}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={typeColor}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{
              r: 5,
              fill: typeColor,
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
