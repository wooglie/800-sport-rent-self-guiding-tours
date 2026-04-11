"use client";

import { CircleMarker } from "react-leaflet";
import type { Coordinates } from "@/types/tour";

interface UserPositionMarkerProps {
  position: Coordinates;
}

export function UserPositionMarker({ position }: UserPositionMarkerProps) {
  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={10}
      pathOptions={{
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.8,
        weight: 3,
        opacity: 0.6,
      }}
    />
  );
}
