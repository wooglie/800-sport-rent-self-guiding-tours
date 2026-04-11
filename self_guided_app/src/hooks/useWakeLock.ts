"use client";

import { useEffect, useRef } from "react";

export function useWakeLock(): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    async function acquire() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // Fail silently — device may not support it or permission denied
      }
    }

    acquire();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        acquire();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
    };
  }, []);
}
