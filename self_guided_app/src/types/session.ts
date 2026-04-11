import type { Locale, Tour } from "./tour";

export type Session = {
  token: string; // the short QR code — used for sharing, NOT the tour JWT
  expiresAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  tours: Tour[]; // ALL tours from API, cached here
};

export type VisitedTour = {
  tourId: string;
  tourName: Record<Locale, string>;
  startedAt: string; // ISO timestamp
};
