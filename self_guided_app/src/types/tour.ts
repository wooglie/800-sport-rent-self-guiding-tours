export type Locale = "hr" | "en";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type TourSummary = {
  id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  distance: string;
  duration: string;
  difficulty: "easy" | "moderate" | "hard";
  coverImage: string;
};

export type POI = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>; // Markdown
  images: string[];
  coordinates?: Coordinates; // optional map pin — shown on the walking route map
  videoUrl?: string; // YouTube / Vimeo embed URL
};

export type Waypoint = {
  id: string;
  coordinates: Coordinates;
  triggerRadiusMeters: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: string[];
  richDescription?: Record<Locale, string>; // Markdown
  walkingRoute?: Coordinates[]; // optional guided walking path inside the waypoint area
  pois?: POI[];
};

export type Tour = TourSummary & {
  startLocation: Coordinates;
  route?: Coordinates[]; // optional — not all tours have a GPS track
  waypoints: Waypoint[];
  createdAt?: string;
  updatedAt?: string;
};
