import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Vertical } from '@prisma/client';

const VALID_VERTICALS = new Set<string>(Object.values(Vertical));

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(vertical?: string) {
    if (vertical && !VALID_VERTICALS.has(vertical)) {
      throw new BadRequestException(`Invalid vertical: ${vertical}. Valid values: ${[...VALID_VERTICALS].join(', ')}`);
    }
    return this.prisma.serviceCategory.findMany({
      where: vertical ? { vertical: vertical as Vertical } : undefined,
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }
}
