import type { Session, VisitedTour } from "@/types/session";
import type { Tour } from "@/types/tour";

const SESSION_KEY = process.env.NEXT_PUBLIC_SESSION_KEY ?? "sport_rent_session";
const VISITED_KEY = process.env.NEXT_PUBLIC_VISITED_KEY ?? "sport_rent_visited";

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function isSessionValid(session: Session): boolean {
  return new Date(session.expiresAt) > new Date();
}

export async function expireSession(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  if ("caches" in window) {
    try {
      await caches.delete("tour-images");
    } catch {
      // ignore cache deletion errors
    }
  }
}

export function getVisitedTours(): VisitedTour[] {
  const raw = localStorage.getItem(VISITED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VisitedTour[];
  } catch {
    return [];
  }
}

export function recordVisit(tour: Tour): void {
  const visited = getVisitedTours();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const alreadyVisitedToday = visited.some(
    (v) => v.tourId === tour.id && v.startedAt.slice(0, 10) === today
  );
  if (alreadyVisitedToday) return;
  visited.push({
    tourId: tour.id,
    tourName: tour.name,
    startedAt: new Date().toISOString(),
  });
  localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
}

export function getShareUrl(token: string): string {
  return window.location.origin + "/auth?token=" + encodeURIComponent(token);
}
