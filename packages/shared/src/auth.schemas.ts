import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  // ADMIN is not self-registerable
  role: z.enum(['CUSTOMER', 'PROVIDER']),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshDto = z.infer<typeof RefreshSchema>;

export const TokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokensResponse = z.infer<typeof TokensResponseSchema>;

export const MeResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['CUSTOMER', 'PROVIDER', 'ADMIN']),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  createdAt: z.string().datetime(),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;
