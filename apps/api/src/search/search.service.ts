import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchServicesDto } from '@marketplace/shared';

interface ServiceSearchRow {
  id: string;
  title: string;
  description: string;
  priceInfo: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  providerProfileId: string;
  businessName: string;
  city: string;
  district: string;
  categoryName: string;
  vertical: string;
  distance_m: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchServices(dto: SearchServicesDto) {
    const radiusMeters = dto.radiusKm * 1000;
    const offset = (dto.page - 1) * dto.limit;

    // $1 = lng, $2 = lat, $3 = radiusMeters — reused by both ST_DWithin and ST_Distance
    const baseParams: unknown[] = [dto.lng, dto.lat, radiusMeters];
    let pIdx = 4;
    let extraWhere = '';

    if (dto.categoryId) {
      extraWhere += ` AND s."categoryId" = $${pIdx}`;
      baseParams.push(dto.categoryId);
      pIdx++;
    }

    if (dto.vertical) {
      // Cast enum column to text for parameterized comparison
      extraWhere += ` AND sc.vertical::text = $${pIdx}`;
      baseParams.push(dto.vertical);
      pIdx++;
    }

    if (dto.text) {
      // TODO: Phase AI — replace ILIKE with pgvector semantic search
      extraWhere += ` AND (s.title ILIKE $${pIdx} OR s.description ILIKE $${pIdx})`;
      baseParams.push(`%${dto.text}%`);
      pIdx++;
    }

    const baseWhere = `
      s.status = 'ACTIVE'
      AND pp.status = 'VERIFIED'
      AND pp.location IS NOT NULL
      AND ST_DWithin(pp.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ${extraWhere}
    `;

    const dataQuery = `
      SELECT
        s.id,
        s.title,
        s.description,
        s."priceInfo",
        s.status,
        s."createdAt",
        s."updatedAt",
        s."categoryId",
        s."providerProfileId",
        pp."businessName",
        pp.city,
        pp.district,
        sc.name AS "categoryName",
        sc.vertical,
        ST_Distance(pp.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_m
      FROM "Service" s
      JOIN "ProviderProfile" pp ON s."providerProfileId" = pp.id
      JOIN "ServiceCategory" sc ON s."categoryId" = sc.id
      WHERE ${baseWhere}
      ORDER BY distance_m ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM "Service" s
      JOIN "ProviderProfile" pp ON s."providerProfileId" = pp.id
      JOIN "ServiceCategory" sc ON s."categoryId" = sc.id
      WHERE ${baseWhere}
    `;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<ServiceSearchRow[]>(
        dataQuery,
        ...baseParams,
        dto.limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<{ total: bigint }[]>(countQuery, ...baseParams),
    ]);

    const total = Number(countRows[0]?.total ?? 0);

    return {
      data: rows.map((r) => ({
        ...r,
        distance_m: Math.round(r.distance_m),
        distance_km: Math.round((r.distance_m / 1000) * 100) / 100,
      })),
      meta: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }
}
