"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import type { AdminSession } from "@/types/session";

type UseSessionResult = {
  session: AdminSession | null;
  isLoading: boolean;
};

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setIsLoading(false);
  }, []);

  return { session, isLoading };
}
