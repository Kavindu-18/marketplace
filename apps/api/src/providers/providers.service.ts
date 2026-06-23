import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProviderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertProviderTransition } from '../state-machine/provider-status.machine';
import {
  CreateProviderProfileDto,
  UpdateProviderProfileDto,
  UploadDocumentDto,
} from '@marketplace/shared';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { verificationDocuments: true },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }

  async createProfile(userId: string, dto: CreateProviderProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Provider profile already exists');

    const { lat, lng, ...rest } = dto;
    const profile = await this.prisma.providerProfile.create({ data: { userId, ...rest } });

    if (lat !== undefined && lng !== undefined) {
      // ST_MakePoint(longitude, latitude) — note argument order
      await this.prisma.$executeRaw`
        UPDATE "ProviderProfile"
        SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${profile.id}
      `;
    }

    return this.prisma.providerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { verificationDocuments: true },
    });
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const { lat, lng, ...rest } = dto;

    await this.prisma.providerProfile.update({ where: { id: profile.id }, data: rest });

    if (lat !== undefined && lng !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE "ProviderProfile"
        SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${profile.id}
      `;
    }

    return this.prisma.providerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { verificationDocuments: true },
    });
  }

  async uploadDocument(userId: string, dto: UploadDocumentDto) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found');

    const doc = await this.prisma.verificationDocument.create({
      data: { providerProfileId: profile.id, type: dto.type, fileUrl: dto.fileUrl },
    });

    // First document upload triggers REGISTERED -> PENDING_VERIFICATION
    if (profile.status === ProviderStatus.REGISTERED) {
      assertProviderTransition(ProviderStatus.REGISTERED, ProviderStatus.PENDING_VERIFICATION);
      await this.prisma.providerProfile.update({
        where: { id: profile.id },
        data: { status: ProviderStatus.PENDING_VERIFICATION },
      });
    }

    return doc;
  }

  findAll() {
    return this.prisma.providerProfile.findMany({
      include: {
        user: { select: { email: true } },
        verificationDocuments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        verificationDocuments: true,
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found');
    return profile;
  }
}
