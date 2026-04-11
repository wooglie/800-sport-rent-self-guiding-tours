export type Locale = "hr" | "en";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Waypoint = {
  id: string;
  coordinates: Coordinates;
  triggerRadiusMeters: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: string[];
};

export type Tour = {
  id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  distance: string;
  duration: string;
  difficulty: "easy" | "moderate" | "hard";
  coverImage: string;
  startLocation: Coordinates;
  route: Coordinates[];
  waypoints: Waypoint[];
};

export type TourSummary = Pick<
  Tour,
  "id" | "name" | "distance" | "duration" | "difficulty"
> & {
  waypointCount: number;
};
