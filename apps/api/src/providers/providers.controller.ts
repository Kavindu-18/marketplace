import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/dto/authenticated-user.interface';
import {
  CreateProviderProfileSchema,
  CreateProviderProfileDto,
  UpdateProviderProfileSchema,
  UpdateProviderProfileDto,
  UploadDocumentSchema,
  UploadDocumentDto,
} from '@marketplace/shared';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ── Provider: own profile ───────────────────────────────────────────────

  @Get('me')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Get own provider profile with verification documents' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  @ApiResponse({ status: 404, description: 'Profile not yet created' })
  getOwnProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.providersService.getOwnProfile(user.id);
  }

  @Post('me')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Create own provider profile' })
  @ApiBody({
    schema: {
      example: {
        businessName: 'Perera Auto Services',
        description: 'Full vehicle service in Colombo',
        contactPhone: '+94711234567',
        contactEmail: 'perera@example.com',
        addressLine: '45 Galle Rd',
        city: 'Colombo',
        district: 'Colombo',
        lat: 6.9271,
        lng: 79.8612,
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Created provider profile' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateProviderProfileSchema)) dto: CreateProviderProfileDto,
  ) {
    return this.providersService.createProfile(user.id, dto);
  }

  @Put('me')
  @Roles(Role.PROVIDER)
  @ApiOperation({ summary: 'Update own provider profile (partial update supported)' })
  @ApiBody({
    schema: {
      example: { description: 'Updated service description', lat: 6.9271, lng: 79.8612 },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated provider profile' })
  @ApiResponse({ status: 404, description: 'Profile not yet created' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateProviderProfileSchema)) dto: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateProfile(user.id, dto);
  }

  @Post('me/documents')
  @Roles(Role.PROVIDER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a verification document URL (file already uploaded to object storage)',
  })
  @ApiBody({
    schema: {
      example: { type: 'BUSINESS_REG', fileUrl: 'https://storage.example.com/doc.pdf' },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document recorded. Triggers PENDING_VERIFICATION status if first document.',
  })
  @ApiResponse({ status: 404, description: 'Profile not yet created' })
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UploadDocumentSchema)) dto: UploadDocumentDto,
  ) {
    return this.providersService.uploadDocument(user.id, dto);
  }

  // ── Admin: read all ─────────────────────────────────────────────────────

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: list all provider profiles' })
  @ApiResponse({ status: 200, description: 'All provider profiles with documents' })
  findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: get a provider profile by ID' })
  @ApiParam({ name: 'id', description: 'Provider profile UUID' })
  @ApiResponse({ status: 200, description: 'Provider profile' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }
}
