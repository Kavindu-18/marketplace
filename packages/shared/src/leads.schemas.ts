import { z } from 'zod';

export const RevealContactSchema = z.object({
  channel: z.enum(['PHONE', 'EMAIL']),
});
export type RevealContactDto = z.infer<typeof RevealContactSchema>;
