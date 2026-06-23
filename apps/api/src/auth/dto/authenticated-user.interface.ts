import { Role, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}
