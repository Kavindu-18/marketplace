import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/dto/authenticated-user.interface';
import { VerificationDecisionSchema, VerificationDecisionDto } from '@marketplace/shared';

@ApiTags('admin / verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // ── Queues ───────────────────────────────────────────────────────────────

  @Get('providers')
  @ApiOperation({ summary: 'Admin: list providers awaiting verification' })
  @ApiResponse({ status: 200, description: 'Providers in PENDING_VERIFICATION, oldest first' })
  getProviderQueue() {
    return this.verificationService.getProviderQueue();
  }

  @Get('services')
  @ApiOperation({ summary: 'Admin: list services awaiting verification' })
  @ApiResponse({ status: 200, description: 'Services in PENDING_VERIFICATION, oldest first' })
  getServiceQueue() {
    return this.verificationService.getServiceQueue();
  }

  // ── Provider decisions ────────────────────────────────────────────────────

  @Post('providers/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: approve a provider (PENDING_VERIFICATION → VERIFIED)' })
  @ApiParam({ name: 'id', description: 'Provider profile UUID' })
  @ApiBody({ schema: { example: { notes: 'Documents verified successfully.' } } })
  @ApiResponse({ status: 200, description: 'Provider is now VERIFIED; documents set to APPROVED' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  approveProvider(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(VerificationDecisionSchema)) dto: VerificationDecisionDto,
  ) {
    return this.verificationService.approveProvider(id, user.id, dto);
  }

  @Post('providers/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: reject a provider (PENDING_VERIFICATION → REJECTED)' })
  @ApiParam({ name: 'id', description: 'Provider profile UUID' })
  @ApiBody({ schema: { example: { notes: 'Business registration document is invalid.' } } })
  @ApiResponse({ status: 200, description: 'Provider is now REJECTED; documents set to REJECTED' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  rejectProvider(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(VerificationDecisionSchema)) dto: VerificationDecisionDto,
  ) {
    return this.verificationService.rejectProvider(id, user.id, dto);
  }

  // ── Service decisions ────────────────────────────────────────────────────

  @Post('services/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: approve a service (PENDING_VERIFICATION → ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiBody({ schema: { example: { notes: 'Service listing meets quality standards.' } } })
  @ApiResponse({ status: 200, description: 'Service is now ACTIVE' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  approveService(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(VerificationDecisionSchema)) dto: VerificationDecisionDto,
  ) {
    return this.verificationService.approveService(id, user.id, dto);
  }

  @Post('services/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: reject a service (PENDING_VERIFICATION → REJECTED)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiBody({ schema: { example: { notes: 'Service description does not meet listing requirements.' } } })
  @ApiResponse({ status: 200, description: 'Service is now REJECTED' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  rejectService(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(VerificationDecisionSchema)) dto: VerificationDecisionDto,
  ) {
    return this.verificationService.rejectService(id, user.id, dto);
  }
}
