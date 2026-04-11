"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Tour, Waypoint, Coordinates, POI } from "@/types/tour";
import { POIMarker } from "./POIMarker";
import { UserPositionMarker } from "./UserPositionMarker";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

function FitBounds({ tour }: { tour: Tour }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    if (tour.route && tour.route.length > 0) {
      map.fitBounds(L.latLngBounds(tour.route.map((c) => [c.lat, c.lng])), { padding: [40, 40] });
    } else if (tour.waypoints.length > 0) {
      map.fitBounds(
        L.latLngBounds(tour.waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng])),
        { padding: [40, 40] }
      );
    }
  }, [map, tour]);

  return null;
}

function PoiSubMarker({ poi, onTap }: { poi: POI; onTap: () => void }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;border-radius:4px;
      background:#f97316;color:#fff;
      border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:10px;
      box-shadow:0 2px 4px rgba(0,0,0,0.3);
    ">P</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker
      position={[poi.coordinates!.lat, poi.coordinates!.lng]}
      icon={icon}
      eventHandlers={{ click: onTap }}
    />
  );
}

interface TourMapProps {
  tour: Tour;
  userPosition: Coordinates | null;
  activeWaypointId: string | null;
  onWaypointTap: (waypoint: Waypoint) => void;
  onPoiTap?: (poi: POI) => void;
}

export default function TourMap({
  tour,
  userPosition,
  activeWaypointId,
  onWaypointTap,
  onPoiTap,
}: TourMapProps) {
  const dark = useDarkMode();

  // OSM standard tiles — works offline after caching
  const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const center: [number, number] =
    tour.waypoints.length > 0
      ? [tour.waypoints[0].coordinates.lat, tour.waypoints[0].coordinates.lng]
      : [44.45, 15.05];

  return (
    <MapContainer center={center} zoom={14} className="w-full h-full" zoomControl>
      <TileLayer url={tileUrl} attribution={tileAttribution} />
      <FitBounds tour={tour} />

      {tour.route && tour.route.length > 0 && (
        <Polyline
          positions={tour.route.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: "#f97316", weight: 5, opacity: 0.9 }}
        />
      )}

      {tour.waypoints.map((wp, i) => (
        <POIMarker
          key={wp.id}
          waypoint={wp}
          index={i}
          isActive={wp.id === activeWaypointId}
          onTap={() => onWaypointTap(wp)}
        />
      ))}

      {onPoiTap && tour.waypoints.flatMap((wp) =>
        (wp.pois ?? [])
          .filter((poi) => poi.coordinates)
          .map((poi) => (
            <PoiSubMarker
              key={`poi-${poi.id}`}
              poi={poi}
              onTap={() => onPoiTap(poi)}
            />
          ))
      )}

      {userPosition && <UserPositionMarker position={userPosition} />}
    </MapContainer>
  );
}
