import { z } from 'zod';

export const CreateProviderProfileSchema = z.object({
  businessName: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  contactPhone: z.string().min(1).max(20),
  contactEmail: z.string().email(),
  addressLine: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
export type CreateProviderProfileDto = z.infer<typeof CreateProviderProfileSchema>;

export const UpdateProviderProfileSchema = CreateProviderProfileSchema.partial();
export type UpdateProviderProfileDto = z.infer<typeof UpdateProviderProfileSchema>;

export const UploadDocumentSchema = z.object({
  type: z.enum(['BUSINESS_REG', 'NIC', 'OTHER']),
  fileUrl: z.string().url(),
});
export type UploadDocumentDto = z.infer<typeof UploadDocumentSchema>;
