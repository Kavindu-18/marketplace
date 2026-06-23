import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProviderStatus,
  ServiceStatus,
  DocumentStatus,
  AdminTargetType,
  AdminDecision,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertProviderTransition } from '../state-machine/provider-status.machine';
import { assertServiceTransition } from '../state-machine/service-status.machine';
import { VerificationDecisionDto } from '@marketplace/shared';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Queues ──────────────────────────────────────────────────────────────

  getProviderQueue() {
    return this.prisma.providerProfile.findMany({
      where: { status: ProviderStatus.PENDING_VERIFICATION },
      include: {
        user: { select: { email: true } },
        verificationDocuments: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  getServiceQueue() {
    return this.prisma.service.findMany({
      where: { status: ServiceStatus.PENDING_VERIFICATION },
      include: {
        category: true,
        providerProfile: { select: { id: true, businessName: true, userId: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // ── Provider decisions ──────────────────────────────────────────────────

  async approveProvider(id: string, reviewerUserId: string, dto: VerificationDecisionDto) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    assertProviderTransition(profile.status, ProviderStatus.VERIFIED);

    await this.prisma.$transaction([
      this.prisma.adminReview.create({
        data: {
          targetType: AdminTargetType.PROVIDER,
          targetId: id,
          reviewerUserId,
          decision: AdminDecision.APPROVED,
          notes: dto.notes,
        },
      }),
      this.prisma.providerProfile.update({
        where: { id },
        data: { status: ProviderStatus.VERIFIED },
      }),
      this.prisma.verificationDocument.updateMany({
        where: { providerProfileId: id, status: DocumentStatus.PENDING },
        data: { status: DocumentStatus.APPROVED },
      }),
    ]);

    return this.prisma.providerProfile.findUniqueOrThrow({
      where: { id },
      include: { verificationDocuments: true },
    });
  }

  async rejectProvider(id: string, reviewerUserId: string, dto: VerificationDecisionDto) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    assertProviderTransition(profile.status, ProviderStatus.REJECTED);

    await this.prisma.$transaction([
      this.prisma.adminReview.create({
        data: {
          targetType: AdminTargetType.PROVIDER,
          targetId: id,
          reviewerUserId,
          decision: AdminDecision.REJECTED,
          notes: dto.notes,
        },
      }),
      this.prisma.providerProfile.update({
        where: { id },
        data: { status: ProviderStatus.REJECTED },
      }),
      this.prisma.verificationDocument.updateMany({
        where: { providerProfileId: id, status: DocumentStatus.PENDING },
        data: { status: DocumentStatus.REJECTED },
      }),
    ]);

    return this.prisma.providerProfile.findUniqueOrThrow({
      where: { id },
      include: { verificationDocuments: true },
    });
  }

  // ── Service decisions ───────────────────────────────────────────────────

  async approveService(id: string, reviewerUserId: string, dto: VerificationDecisionDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');

    assertServiceTransition(service.status, ServiceStatus.ACTIVE);

    await this.prisma.$transaction([
      this.prisma.adminReview.create({
        data: {
          targetType: AdminTargetType.SERVICE,
          targetId: id,
          reviewerUserId,
          decision: AdminDecision.APPROVED,
          notes: dto.notes,
        },
      }),
      this.prisma.service.update({
        where: { id },
        data: { status: ServiceStatus.ACTIVE },
      }),
    ]);

    return this.prisma.service.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
  }

  async rejectService(id: string, reviewerUserId: string, dto: VerificationDecisionDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');

    assertServiceTransition(service.status, ServiceStatus.REJECTED);

    await this.prisma.$transaction([
      this.prisma.adminReview.create({
        data: {
          targetType: AdminTargetType.SERVICE,
          targetId: id,
          reviewerUserId,
          decision: AdminDecision.REJECTED,
          notes: dto.notes,
        },
      }),
      this.prisma.service.update({
        where: { id },
        data: { status: ServiceStatus.REJECTED },
      }),
    ]);

    return this.prisma.service.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
  }
}
