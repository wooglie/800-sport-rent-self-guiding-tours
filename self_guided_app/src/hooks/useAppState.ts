"use client";

import { useEffect, useState } from "react";
import {
  getSession,
  isSessionValid,
  expireSession,
  getVisitedTours,
} from "@/lib/session";
import type { Session, VisitedTour } from "@/types/session";

export type AppState = "loading" | "no_access" | "active" | "expired";

export function useAppState(): {
  appState: AppState;
  session: Session | null;
  visitedTours: VisitedTour[];
} {
  const [appState, setAppState] = useState<AppState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [visitedTours, setVisitedTours] = useState<VisitedTour[]>([]);

  useEffect(() => {
    const visited = getVisitedTours();
    setVisitedTours(visited);

    const sess = getSession();

    if (sess && isSessionValid(sess)) {
      setSession(sess);
      setAppState("active");
    } else {
      if (sess) {
        // Session exists but is expired — clean it up
        expireSession();
      }
      if (visited.length > 0) {
        setAppState("expired");
      } else {
        setAppState("no_access");
      }
    }
  }, []);

  return { appState, session, visitedTours };
}
