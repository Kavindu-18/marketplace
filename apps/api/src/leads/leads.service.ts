import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactChannel, ProviderStatus, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async revealContact(
    serviceId: string,
    channel: ContactChannel,
    customerUserId: string | null,
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        providerProfile: {
          select: {
            id: true,
            contactPhone: true,
            contactEmail: true,
            status: true,
          },
        },
      },
    });

    if (!service || service.status !== ServiceStatus.ACTIVE) {
      throw new NotFoundException('Service not found');
    }
    if (service.providerProfile.status !== ProviderStatus.VERIFIED) {
      throw new NotFoundException('Service not found');
    }

    // TODO: Phase 2 — check subscription / charge the lead before revealing contact info.
    // The ContactRevealEvent row below is the billing hook: each row = one paid reveal.
    await this.prisma.contactRevealEvent.create({
      data: {
        serviceId,
        providerProfileId: service.providerProfile.id,
        customerUserId,
        channel,
      },
    });

    return {
      contactPhone: service.providerProfile.contactPhone,
      contactEmail: service.providerProfile.contactEmail,
    };
  }
}
