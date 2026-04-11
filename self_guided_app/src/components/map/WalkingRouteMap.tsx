"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, POI } from "@/types/tour";

function useDarkMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function FitRoute({ route }: { route: Coordinates[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || route.length < 2) return;
    fitted.current = true;
    const bounds = L.latLngBounds(route.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, route]);

  return null;
}

export interface WalkingRouteMapProps {
  route: Coordinates[];
  waypointLocation: Coordinates;
  pois?: POI[];
  onPoiTap?: (poi: POI) => void;
}

export function WalkingRouteMap({
  route,
  waypointLocation,
  pois,
  onPoiTap,
}: WalkingRouteMapProps) {
  const dark = useDarkMode();

  const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const poisWithCoords = (pois ?? []).filter((p) => p.coordinates);
  let poiIndex = 0;

  return (
    <MapContainer
      center={[waypointLocation.lat, waypointLocation.lng]}
      zoom={13}
      className="w-full h-48"
    >
      <TileLayer url={tileUrl} attribution={tileAttribution} />
      <FitRoute route={route} />

      <Polyline
        positions={route.map((c) => [c.lat, c.lng])}
        pathOptions={{ color: "#f97316", weight: 4, opacity: 0.9 }}
      />

      <CircleMarker
        center={[waypointLocation.lat, waypointLocation.lng]}
        radius={8}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.8,
          weight: 2,
        }}
      />

      {poisWithCoords.map((poi) => {
        poiIndex++;
        const idx = poiIndex;
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:#f97316;color:#fff;
            border:2px solid #fff;
            display:flex;align-items:center;justify-content:center;
            font-weight:700;font-size:12px;
            box-shadow:0 2px 4px rgba(0,0,0,0.3);
          ">${idx}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        return (
          <Marker
            key={poi.id}
            position={[poi.coordinates!.lat, poi.coordinates!.lng]}
            icon={icon}
            eventHandlers={{ click: () => onPoiTap?.(poi) }}
          />
        );
      })}
    </MapContainer>
  );
}
