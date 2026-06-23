import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ContactChannel } from '@prisma/client';
import { LeadsService } from './leads.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/dto/authenticated-user.interface';
import { RevealContactSchema, RevealContactDto } from '@marketplace/shared';

@ApiTags('leads')
@Controller('services')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post(':id/reveal-contact')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reveal provider contact info and record a lead event',
    description:
      'Returns contactPhone and contactEmail for the service\'s provider. ' +
      'Writes a ContactRevealEvent row as the future pay-per-lead billing hook (free in Phase 1). ' +
      'Authentication is optional — pass a Bearer token to associate the lead with a customer account.',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiBody({ schema: { example: { channel: 'PHONE' } } })
  @ApiResponse({
    status: 201,
    description: 'Contact info returned and lead event recorded',
    schema: {
      example: { contactPhone: '+94711234567', contactEmail: 'provider@example.com' },
    },
  })
  @ApiResponse({ status: 404, description: 'Service not found or not available' })
  revealContact(
    @Param('id') serviceId: string,
    @CurrentUser() user: AuthenticatedUser | null,
    @Body(new ZodValidationPipe(RevealContactSchema)) dto: RevealContactDto,
  ) {
    return this.leadsService.revealContact(
      serviceId,
      dto.channel as ContactChannel,
      user?.id ?? null,
    );
  }
}
