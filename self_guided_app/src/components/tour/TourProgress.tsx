"use client";

import type { Tour, Coordinates } from "@/types/tour";

interface TourProgressProps {
  tour: Tour;
  userPosition: Coordinates | null;
  visitedCount: number;
}

function projectToRoute(
  position: Coordinates,
  route: Coordinates[]
): number {
  if (route.length < 2) return 0;

  let totalDist = 0;
  let coveredDist = 0;
  let minSegDist = Infinity;

  function haversine(a: Coordinates, b: Coordinates): number {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  for (let i = 0; i < route.length - 1; i++) {
    const segLen = haversine(route[i], route[i + 1]);
    const dToSeg = Math.min(
      haversine(position, route[i]),
      haversine(position, route[i + 1])
    );
    if (dToSeg < minSegDist) {
      minSegDist = dToSeg;
      coveredDist = totalDist + segLen / 2;
    }
    totalDist += segLen;
  }

  return Math.min(coveredDist, totalDist);
}

export function TourProgress({
  tour,
  userPosition,
  visitedCount,
}: TourProgressProps) {
  const totalKm = parseFloat(tour.distance) || 0;
  let coveredKm = 0;

  if (userPosition && tour.route && tour.route.length >= 2) {
    coveredKm = projectToRoute(userPosition, tour.route) / 1000;
  }

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
      <span>
        {coveredKm.toFixed(1)} / {tour.distance}
      </span>
      <span>
        {visitedCount} / {tour.waypoints.length}
      </span>
    </div>
  );
}
