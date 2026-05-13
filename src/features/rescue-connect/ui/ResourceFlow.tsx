"use client";

// =============================================================================
// RESOURCE FLOW - Sankey Diagram for Resource Allocation
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - SVG-based Sankey diagram
//   - Source nodes (organizations) → Incident nodes → Outcome nodes
//   - Flow lines with thickness proportional to value
//   - Color-coded by resource type
//   - Hover tooltips
//   - Legend
//   - Animated entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Package,
  Droplets,
  Stethoscope,
  Truck,
  Info,
} from "lucide-react";
import clsx from "clsx";
import type { ResourceFlowData, ResourceFlowNode, ResourceFlowLink, ResourceFlowProps } from "../lib/types";
import { RESOURCE_TYPE_CONFIG } from "../config/rescue-config";

// =============================================================================
// SANKEY LAYOUT CALCULATOR
// =============================================================================

interface SankeyNode extends ResourceFlowNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SankeyLink extends ResourceFlowLink {
  sourceNode: SankeyNode;
  targetNode: SankeyNode;
  sy: number;
  ty: number;
  width: number;
}

function calculateSankeyLayout(
  data: ResourceFlowData,
  width: number,
  height: number,
  padding: number = 20
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  // Group nodes by type
  const sourceNodes = data.nodes.filter((n) => n.type === "source");
  const incidentNodes = data.nodes.filter((n) => n.type === "incident");
  const outcomeNodes = data.nodes.filter((n) => n.type === "outcome");

  // Calculate column x positions
  const columnWidth = (width - padding * 2) / 3;
  const nodeWidth = 16;

  // Calculate node positions
  const allNodes: SankeyNode[] = [];

  // Source nodes (left column)
  const sourceTotal = sourceNodes.reduce((sum, n) => sum + n.value, 0);
  let sourceY = padding;
  for (const node of sourceNodes) {
    const nodeHeight = Math.max(20, (node.value / sourceTotal) * (height - padding * 2));
    allNodes.push({
      ...node,
      x: padding,
      y: sourceY,
      width: nodeWidth,
      height: nodeHeight,
    });
    sourceY += nodeHeight + 8;
  }

  // Incident nodes (middle column)
  const incidentTotal = incidentNodes.reduce((sum, n) => sum + n.value, 0);
  let incidentY = padding;
  for (const node of incidentNodes) {
    const nodeHeight = Math.max(20, (node.value / incidentTotal) * (height - padding * 2));
    allNodes.push({
      ...node,
      x: padding + columnWidth,
      y: incidentY,
      width: nodeWidth,
      height: nodeHeight,
    });
    incidentY += nodeHeight + 8;
  }

  // Outcome nodes (right column)
  const outcomeTotal = outcomeNodes.reduce((sum, n) => sum + n.value, 0);
  let outcomeY = padding;
  for (const node of outcomeNodes) {
    const nodeHeight = Math.max(20, (node.value / outcomeTotal) * (height - padding * 2));
    allNodes.push({
      ...node,
      x: padding + columnWidth * 2,
      y: outcomeY,
      width: nodeWidth,
      height: nodeHeight,
    });
    outcomeY += nodeHeight + 8;
  }

  // Calculate link positions
  const allLinks: SankeyLink[] = [];
  const sourceOutputMap = new Map<string, number>();
  const targetInputMap = new Map<string, number>();

  for (const link of data.links) {
    const sourceNode = allNodes.find((n) => n.id === link.source);
    const targetNode = allNodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) continue;

    const sourceOutput = sourceOutputMap.get(link.source) || 0;
    const targetInput = targetInputMap.get(link.target) || 0;

    const maxLinkValue = Math.max(...data.links.map((l) => l.value));
    const linkWidth = Math.max(3, (link.value / maxLinkValue) * 30);

    allLinks.push({
      ...link,
      sourceNode,
      targetNode,
      sy: sourceNode.y + sourceNode.height * (sourceOutput / sourceNode.value),
      ty: targetNode.y + targetNode.height * (targetInput / targetNode.value),
      width: linkWidth,
    });

    sourceOutputMap.set(link.source, sourceOutput + link.value);
    targetInputMap.set(link.target, targetInput + link.value);
  }

  return { nodes: allNodes, links: allLinks };
}

// =============================================================================
// SANKEY SVG COMPONENT
// =============================================================================

function SankeySVG({ data, width, height }: { data: ResourceFlowData; width: number; height: number }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const layout = useMemo(
    () => calculateSankeyLayout(data, width, height),
    [data, width, height]
  );

  // Generate path for link
  const getLinkPath = (link: SankeyLink): string => {
    const sx = link.sourceNode.x + link.sourceNode.width;
    const sy = link.sy;
    const tx = link.targetNode.x;
    const ty = link.ty;
    const mx = (sx + tx) / 2;

    return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
  };

  // Color for node type
  const getNodeColor = (type: string): string => {
    switch (type) {
      case "source": return "#3B82F6";
      case "incident": return "#EF4444";
      case "outcome": return "#22C55E";
      default: return "#6B7280";
    }
  };

  // Color for link based on resource type
  const getLinkColor = (resourceType: string): string => {
    const config = RESOURCE_TYPE_CONFIG[resourceType as keyof typeof RESOURCE_TYPE_CONFIG];
    return config?.color || "#6B7280";
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Links */}
      {layout.links.map((link, i) => (
        <g key={i}>
          <motion.path
            d={getLinkPath(link)}
            fill="none"
            stroke={getLinkColor(link.resourceType)}
            strokeWidth={link.width}
            strokeOpacity={hoveredLink === i ? 0.6 : 0.25}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
            onMouseEnter={() => setHoveredLink(i)}
            onMouseLeave={() => setHoveredLink(null)}
            className="cursor-pointer"
          />
          {/* Tooltip */}
          {hoveredLink === i && (
            <g>
              <rect
                x={(link.sourceNode.x + link.targetNode.x) / 2 - 50}
                y={Math.min(link.sy, link.ty) - 25}
                width={100}
                height={20}
                rx={4}
                fill="#1E293B"
                stroke="#334155"
                strokeWidth={1}
              />
              <text
                x={(link.sourceNode.x + link.targetNode.x) / 2}
                y={Math.min(link.sy, link.ty) - 12}
                textAnchor="middle"
                fill="#E2E8F0"
                fontSize={10}
                fontFamily="system-ui"
              >
                {link.value} {RESOURCE_TYPE_CONFIG[link.resourceType as keyof typeof RESOURCE_TYPE_CONFIG]?.labelVi || link.resourceType}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Nodes */}
      {layout.nodes.map((node) => {
        const color = getNodeColor(node.type);
        const isHovered = hoveredNode === node.id;

        return (
          <g
            key={node.id}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
          >
            <motion.rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx={4}
              fill={color}
              fillOpacity={isHovered ? 0.9 : 0.7}
              stroke={color}
              strokeWidth={isHovered ? 2 : 0}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: node.type === "source" ? 0 : node.type === "incident" ? 0.2 : 0.4 }}
              style={{ transformOrigin: `${node.x + node.width / 2}px ${node.y + node.height / 2}px` }}
            />
            {/* Label */}
            <text
              x={node.type === "source" ? node.x - 8 : node.type === "outcome" ? node.x + node.width + 8 : node.x + node.width / 2}
              y={node.y + node.height / 2}
              textAnchor={node.type === "source" ? "end" : node.type === "outcome" ? "start" : "middle"}
              dominantBaseline="middle"
              fill="#CBD5E1"
              fontSize={10}
              fontFamily="system-ui"
              fontWeight={isHovered ? 600 : 400}
            >
              {node.name}
            </text>
            {/* Value */}
            <text
              x={node.type === "source" ? node.x - 8 : node.type === "outcome" ? node.x + node.width + 8 : node.x + node.width / 2}
              y={node.y + node.height / 2 + 12}
              textAnchor={node.type === "source" ? "end" : node.type === "outcome" ? "start" : "middle"}
              dominantBaseline="middle"
              fill="#64748B"
              fontSize={8}
              fontFamily="system-ui"
            >
              {node.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// =============================================================================
// LEGEND
// =============================================================================

function FlowLegend() {
  const items = [
    { label: "Nguồn", color: "#3B82F6", icon: <Building2 className="w-3 h-3" /> },
    { label: "Sự cố", color: "#EF4444", icon: <AlertTriangle className="w-3 h-3" /> },
    { label: "Kết quả", color: "#22C55E", icon: <CheckCircle2 className="w-3 h-3" /> },
  ];

  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
          <span className="text-[10px] text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ResourceFlowComponent({ flowData, incidents, className }: ResourceFlowProps) {
  const totalFlow = useMemo(
    () => flowData.links.reduce((sum, l) => sum + l.value, 0),
    [flowData]
  );

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">Dòng tài nguyên</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Tổng: {totalFlow} đơn vị</span>
        </div>
      </div>

      {/* Legend */}
      <FlowLegend />

      {/* Sankey diagram */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 overflow-x-auto">
        {flowData.nodes.length > 0 ? (
          <SankeySVG data={flowData} width={700} height={300} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">Chưa có dữ liệu dòng tài nguyên</p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {flowData.nodes
          .filter((n) => n.type === "source")
          .map((node) => (
            <div
              key={node.id}
              className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-semibold text-slate-200">{node.name}</span>
              </div>
              <span className="text-lg font-bold text-blue-400">{node.value}</span>
              <span className="text-[9px] text-slate-500 ml-1">đơn vị</span>
            </div>
          ))}
      </div>

      {/* Info note */}
      <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-blue-400">
          Biểu đồ Sankey thể hiện luồng tài nguyên từ các tổ chức nguồn qua sự cố đến kết quả.
          Độ rộng đường nối tỷ lệ với số lượng tài nguyên.
        </p>
      </div>
    </div>
  );
}

export const ResourceFlow = memo(ResourceFlowComponent);
