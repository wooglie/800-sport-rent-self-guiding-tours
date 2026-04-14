"use client";

import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js");
    } else {
      // In dev mode the production sw.js from public/ would still be served,
      // and its Workbox precaching would fetch /__next.*.txt files that don't
      // exist in the dev server — causing 500s and cascade hook errors.
      // Proactively unregister any stale service worker from a prior prod build.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      });
    }
  }, []);
  return null;
}
