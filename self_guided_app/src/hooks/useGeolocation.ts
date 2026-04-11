"use client";

import { useEffect, useState } from "react";
import type { Coordinates } from "@/types/tour";

export function useGeolocation(): {
  position: Coordinates | null;
  error: string | null;
  isSupported: boolean;
} {
  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setError("errors.gps");
        } else {
          setError("errors.gps");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSupported]);

  return { position, error, isSupported };
}
