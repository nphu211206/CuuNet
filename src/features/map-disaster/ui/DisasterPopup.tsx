"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { DisasterEvent } from "@/lib/types";
import { SEVERITY_COLORS, DISASTER_ICONS } from "../config/map-config";
import { formatRelativeTime, formatNumber, getSeverityInlineStyle } from "@/lib/utils";

interface DisasterPopupProps {
  disaster: DisasterEvent;
  isOpen: boolean;
  onClose: () => void;
}

export default function DisasterPopup({
  disaster,
  isOpen,
  onClose,
}: DisasterPopupProps) {
  const map = useMap();
  const popupRef = useRef<L.Popup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    const color = SEVERITY_COLORS[disaster.severity];
    const icon = DISASTER_ICONS[disaster.type];

    const container = L.DomUtil.create("div");
    containerRef.current = container;

    container.innerHTML = `
      <div style="
        background: #0f172a;
        border: 1px solid ${color}33;
        border-radius: 16px;
        padding: 16px;
        min-width: 280px;
        max-width: 320px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${color}11;
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:24px;">${icon}</span>
          <div style="flex:1;">
            <h3 style="font-weight:700;color:#f1f5f9;font-size:15px;margin:0 0 4px 0;">
              ${disaster.title}
            </h3>
            <span style="
              display:inline-block;
              padding:2px 8px;
              border-radius:9999px;
              font-size:11px;
              font-weight:600;
              ${getSeverityInlineStyle(disaster.severity)}
            ">${disaster.severity === "critical" ? "Khẩn cấp" : disaster.severity === "high" ? "Nguy hiểm" : disaster.severity === "medium" ? "Cảnh báo" : "Thấp"}</span>
          </div>
        </div>

        <p style="color:#94a3b8;font-size:13px;margin:0 0 12px 0;line-height:1.5;">
          ${disaster.description}
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px;">
            <div style="color:#64748b;font-size:11px;">Ảnh hưởng</div>
            <div style="color:#f1f5f9;font-weight:600;font-size:14px;">${formatNumber(disaster.affectedPeople)} người</div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px;">
            <div style="color:#64748b;font-size:11px;">Cập nhật</div>
            <div style="color:#f1f5f9;font-weight:600;font-size:14px;">${formatRelativeTime(disaster.updatedAt)}</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button id="popup-detail-btn" style="
            flex:1;
            padding:8px 16px;
            background:linear-gradient(135deg, #3b82f6, #2563eb);
            color:white;
            border:none;
            border-radius:8px;
            font-size:13px;
            font-weight:600;
            cursor:pointer;
            transition:all 0.2s;
          ">Xem chi tiết</button>
          <button id="popup-close-btn" style="
            padding:8px 16px;
            background:rgba(255,255,255,0.05);
            color:#94a3b8;
            border:1px solid rgba(255,255,255,0.1);
            border-radius:8px;
            font-size:13px;
            cursor:pointer;
            transition:all 0.2s;
          ">Đóng</button>
        </div>
      </div>
    `;

    const popup = L.popup({
      closeButton: false,
      maxWidth: 340,
      className: "custom-disaster-popup",
    })
      .setLatLng([disaster.location.lat, disaster.location.lng])
      .setContent(container)
      .openOn(map);

    popupRef.current = popup;

    const closeBtn = container.querySelector("#popup-close-btn");
    closeBtn?.addEventListener("click", () => {
      onClose();
      popup.remove();
    });

    const detailBtn = container.querySelector("#popup-detail-btn");
    detailBtn?.addEventListener("click", () => {
      onClose();
      popup.remove();
    });

    return () => {
      popup.remove();
      popupRef.current = null;
    };
  }, [map, disaster, isOpen, onClose]);

  return null;
}
