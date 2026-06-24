import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProviderStatus, ServiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertServiceTransition } from '../state-machine/service-status.machine';
import { CreateServiceDto, UpdateServiceDto } from '@marketplace/shared';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProfileForUser(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  private async requireOwnedService(id: string, providerProfileId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    if (service.providerProfileId !== providerProfileId) {
      throw new ForbiddenException('Not your service');
    }
    return service;
  }

  async findAllOwn(userId: string) {
    const profile = await this.getProfileForUser(userId);
    return this.prisma.service.findMany({
      where: { providerProfileId: profile.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const profile = await this.getProfileForUser(userId);
    return this.requireOwnedService(id, profile.id);
  }

  async create(userId: string, dto: CreateServiceDto) {
    const profile = await this.getProfileForUser(userId);
    return this.prisma.service.create({
      data: {
        providerProfileId: profile.id,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        priceInfo: dto.priceInfo,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, dto: UpdateServiceDto) {
    const profile = await this.getProfileForUser(userId);
    const service = await this.requireOwnedService(id, profile.id);
    if (service.status !== ServiceStatus.DRAFT && service.status !== ServiceStatus.REJECTED) {
      throw new BadRequestException('Only DRAFT or REJECTED services can be edited');
    }
    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string, userId: string) {
    const profile = await this.getProfileForUser(userId);
    const service = await this.requireOwnedService(id, profile.id);
    if (service.status !== ServiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT services can be deleted');
    }
    await this.prisma.service.delete({ where: { id } });
  }

  async findPublic(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, status: ServiceStatus.ACTIVE },
      include: {
        category: true,
        providerProfile: { select: { businessName: true, city: true } },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async submit(id: string, userId: string) {
    const profile = await this.getProfileForUser(userId);
    if (profile.status !== ProviderStatus.VERIFIED) {
      throw new ForbiddenException('Provider must be VERIFIED to submit services for review');
    }
    const service = await this.requireOwnedService(id, profile.id);
    assertServiceTransition(service.status, ServiceStatus.PENDING_VERIFICATION);
    return this.prisma.service.update({
      where: { id },
      data: { status: ServiceStatus.PENDING_VERIFICATION },
      include: { category: true },
    });
  }
}
