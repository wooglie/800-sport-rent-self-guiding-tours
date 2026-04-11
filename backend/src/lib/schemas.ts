import { z } from 'zod';

export const CoordinatesSchema = z.object({ lat: z.number(), lng: z.number() });
export const LocalizedStringSchema = z.object({ hr: z.string(), en: z.string() });

export const POISchema = z.object({
  id: z.string().min(1),
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,
  images: z.array(z.string()),
  coordinates: CoordinatesSchema.optional(),
  videoUrl: z.string().url().optional(),
});

export const WaypointSchema = z.object({
  id: z.string().min(1),
  coordinates: CoordinatesSchema,
  triggerRadiusMeters: z.number().positive(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  images: z.array(z.string()),
  richDescription: LocalizedStringSchema.optional(),
  pois: z.array(POISchema).optional(),
  walkingRoute: z.array(CoordinatesSchema).optional(),
});

export const TourInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a URL-safe slug'),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  distance: z.string().min(1),
  duration: z.string().min(1),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  coverImage: z.string().url(),
  startLocation: CoordinatesSchema,
  route: z.array(CoordinatesSchema).min(2, 'Route must have at least 2 points').optional(),
  waypoints: z.array(WaypointSchema).min(1, 'At least one waypoint required'),
});

export const TourUpdateSchema = TourInputSchema.partial().omit({ id: true });

export type TourInput = z.infer<typeof TourInputSchema>;
export type TourUpdate = z.infer<typeof TourUpdateSchema>;
