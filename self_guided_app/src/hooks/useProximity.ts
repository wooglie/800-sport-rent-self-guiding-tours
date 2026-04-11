"use client";

import { useEffect, useRef, useState } from "react";
import type { Waypoint, Coordinates } from "@/types/tour";

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000; // Earth radius in metres
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useProximity(
  waypoints: Waypoint[],
  userPosition: Coordinates | null
): {
  triggeredWaypoint: Waypoint | null;
  triggeredIds: Set<string>;
} {
  const [triggeredWaypoint, setTriggeredWaypoint] = useState<Waypoint | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userPosition) return;

    let closest: Waypoint | null = null;
    let closestDist = Infinity;

    for (const wp of waypoints) {
      if (triggeredRef.current.has(wp.id)) continue;
      const dist = haversineDistance(userPosition, wp.coordinates);
      if (dist <= wp.triggerRadiusMeters && dist < closestDist) {
        closest = wp;
        closestDist = dist;
      }
    }

    if (closest) {
      triggeredRef.current.add(closest.id);
      setTriggeredIds(new Set(triggeredRef.current));
      setTriggeredWaypoint(closest);
    }
  }, [userPosition, waypoints]);

  return { triggeredWaypoint, triggeredIds };
}
