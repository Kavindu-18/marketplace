import { z } from 'zod';

// Query params arrive as strings — z.coerce.number() handles the conversion.
export const SearchServicesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(500),
  categoryId: z.string().uuid().optional(),
  vertical: z.enum(['CONSULTATION', 'VEHICLE_SERVICE']).optional(),
  // TODO: Phase AI — replace ILIKE with pgvector semantic search
  text: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type SearchServicesDto = z.infer<typeof SearchServicesSchema>;
