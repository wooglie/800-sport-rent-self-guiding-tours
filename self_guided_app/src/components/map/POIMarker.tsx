"use client";

import { useEffect, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Waypoint } from "@/types/tour";

interface POIMarkerProps {
  waypoint: Waypoint;
  index: number;
  isActive: boolean;
  onTap: () => void;
}

export function POIMarker({ waypoint, index, isActive, onTap }: POIMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);

  const size = isActive ? 40 : 32;
  const bg = isActive ? "#171717" : "#ffffff";
  const color = isActive ? "#ffffff" : "#171717";
  const border = isActive ? "none" : "2px solid #171717";

  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};color:${color};
      border:${border};
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${isActive ? 16 : 13}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      transition:all 0.2s;
    ">${index + 1}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  // Bring to front when active
  useEffect(() => {
    if (isActive && markerRef.current) {
      markerRef.current.openPopup?.();
      map.panTo([waypoint.coordinates.lat, waypoint.coordinates.lng]);
    }
  }, [isActive, waypoint.coordinates, map]);

  return (
    <Marker
      ref={markerRef}
      position={[waypoint.coordinates.lat, waypoint.coordinates.lng]}
      icon={icon}
      zIndexOffset={1000}
      eventHandlers={{ click: onTap }}
    />
  );
}
