import { z } from 'zod';

export const CreateServiceSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priceInfo: z.string().min(1).max(500),
});
export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema.partial();
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
