import { z } from 'zod';

export const VerificationDecisionSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});
export type VerificationDecisionDto = z.infer<typeof VerificationDecisionSchema>;
