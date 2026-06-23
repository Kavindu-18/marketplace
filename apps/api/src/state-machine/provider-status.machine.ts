import { BadRequestException } from '@nestjs/common';
import { ProviderStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: [ProviderStatus, ProviderStatus][] = [
  [ProviderStatus.REGISTERED, ProviderStatus.PENDING_VERIFICATION],
  [ProviderStatus.PENDING_VERIFICATION, ProviderStatus.VERIFIED],
  [ProviderStatus.PENDING_VERIFICATION, ProviderStatus.REJECTED],
  [ProviderStatus.VERIFIED, ProviderStatus.SUSPENDED],
  [ProviderStatus.REJECTED, ProviderStatus.SUSPENDED],
];

export function assertProviderTransition(from: ProviderStatus, to: ProviderStatus): void {
  const allowed = ALLOWED_TRANSITIONS.some(([f, t]) => f === from && t === to);
  if (!allowed) {
    throw new BadRequestException(
      `Illegal provider status transition: ${from} → ${to}. ` +
        `Allowed transitions: ${ALLOWED_TRANSITIONS.map(([f, t]) => `${f}→${t}`).join(', ')}`,
    );
  }
}
