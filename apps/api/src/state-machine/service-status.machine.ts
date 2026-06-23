import { BadRequestException } from '@nestjs/common';
import { ServiceStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: [ServiceStatus, ServiceStatus][] = [
  [ServiceStatus.DRAFT, ServiceStatus.PENDING_VERIFICATION],
  [ServiceStatus.PENDING_VERIFICATION, ServiceStatus.ACTIVE],
  [ServiceStatus.PENDING_VERIFICATION, ServiceStatus.REJECTED],
];

export function assertServiceTransition(from: ServiceStatus, to: ServiceStatus): void {
  const allowed = ALLOWED_TRANSITIONS.some(([f, t]) => f === from && t === to);
  if (!allowed) {
    throw new BadRequestException(
      `Illegal service status transition: ${from} → ${to}. ` +
        `Allowed transitions: ${ALLOWED_TRANSITIONS.map(([f, t]) => `${f}→${t}`).join(', ')}`,
    );
  }
}
