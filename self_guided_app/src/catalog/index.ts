import type { TourSummary } from "@/types/tour";

export const TOUR_CATALOG: TourSummary[] = [
  {
    id: "ebike-avantura",
    name: { hr: "E-bike avantura", en: "E-bike Adventure" },
    description: {
      hr: "Tura vodi kroz stari grad Pag, uz bazene soli do Paške solane, a završava panoramskim pogledom na grad, planinu Velebit i okolne otoke.",
      en: "We ride from the town center through the Old Town and the saltworks, finishing with a panoramic view of Pag, Velebit mountain range and the surrounding islands.",
    },
    distance: "20 km",
    duration: "~4h",
    difficulty: "moderate",
    coverImage: "https://d10r6qv1jolyvi.cloudfront.net/image/promo-5.jpg",
  },
];

export function getTourSummary(id: string): TourSummary | null {
  return TOUR_CATALOG.find((t) => t.id === id) ?? null;
}
