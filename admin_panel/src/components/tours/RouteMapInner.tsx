"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Coordinates, Waypoint, Locale } from "@/types/tour";

// Fix default Leaflet marker icons broken by webpack/turbopack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type RouteMapInnerProps = {
  route: Coordinates[];
  waypoints: Waypoint[];
  startLocation: Coordinates;
  activeLocale: Locale;
};

function AutoFit({ route, waypoints, startLocation }: RouteMapInnerProps) {
  const map = useMap();

  useEffect(() => {
    const allPoints: [number, number][] = [
      [startLocation.lat, startLocation.lng] as [number, number],
      ...route.map((c): [number, number] => [c.lat, c.lng]),
      ...waypoints.map((w): [number, number] => [
        w.coordinates.lat,
        w.coordinates.lng,
      ]),
    ];
    const points = allPoints.filter(([lat, lng]) => lat !== 0 || lng !== 0);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
  }, [map, route, waypoints, startLocation]);

  return null;
}

export function RouteMapInner({
  route,
  waypoints,
  startLocation,
  activeLocale,
}: RouteMapInnerProps) {
  const center: [number, number] =
    route.length > 0
      ? [route[0].lat, route[0].lng]
      : startLocation.lat !== 0
        ? [startLocation.lat, startLocation.lng]
        : [44.4, 15.0]; // fallback: Croatia

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "360px", width: "100%" }}
      className="z-0 rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route polyline */}
      {route.length > 1 && (
        <Polyline
          positions={route.map((c) => [c.lat, c.lng])}
          pathOptions={{ color: "#6366f1", weight: 3, opacity: 0.8 }}
        />
      )}

      {/* Start location marker */}
      {startLocation.lat !== 0 && (
        <Marker position={[startLocation.lat, startLocation.lng]}>
          <Tooltip direction="top" offset={[0, -28]} permanent={false}>
            Start
          </Tooltip>
        </Marker>
      )}

      {/* Waypoint markers */}
      {waypoints.map((wp, i) => {
        const { lat, lng } = wp.coordinates;
        if (lat === 0 && lng === 0) return null;
        const other: Locale = activeLocale === "hr" ? "en" : "hr";
        const label = wp.name?.[activeLocale] || wp.name?.[other] || `WP ${i + 1}`;
        return (
          <CircleMarker
            key={wp.id || i}
            center={[lat, lng]}
            radius={10}
            pathOptions={{
              fillColor: "#6366f1",
              color: "#fff",
              weight: 2,
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} permanent>
              <span className="text-xs font-semibold">
                {i + 1}. {label}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      <AutoFit
        route={route}
        waypoints={waypoints}
        startLocation={startLocation}
        activeLocale={activeLocale}
      />
    </MapContainer>
  );
}
