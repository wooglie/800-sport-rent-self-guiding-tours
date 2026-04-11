import type { AdminSession } from "@/types/session";

const SESSION_KEY =
  process.env.NEXT_PUBLIC_SESSION_KEY ?? "admin_session";

export function saveSession(session: AdminSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAccessTokenExpiringSoon(session: AdminSession): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return session.accessExpiresAt - nowSeconds < 60;
}
