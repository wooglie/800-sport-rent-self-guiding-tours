"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Fails silently in dev (sw.js not generated) or if SW is unsupported.
      });
    }
  }, []);
  return null;
}
