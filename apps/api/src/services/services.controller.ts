import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from '../auth/dto/authenticated-user.interface';
import {
  CreateServiceSchema,
  CreateServiceDto,
  UpdateServiceSchema,
  UpdateServiceDto,
} from '@marketplace/shared';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PROVIDER)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services belonging to the authenticated provider' })
  @ApiResponse({ status: 200, description: 'Provider\'s services with category info' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findAllOwn(user.id);
  }

  @Get(':id/public')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Public: get an ACTIVE service by ID (no auth required)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Active service with category and provider info' })
  @ApiResponse({ status: 404, description: 'Service not found or not active' })
  findPublic(@Param('id') id: string) {
    return this.servicesService.findPublic(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service (must be owned by the authenticated provider)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service detail' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 403, description: 'Not your service' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service (starts in DRAFT status)' })
  @ApiBody({
    schema: {
      example: {
        categoryId: '00000000-0000-0000-0000-000000000001',
        title: 'Full Car Service',
        description: 'Includes oil change, filter replacement, and inspection',
        priceInfo: 'From LKR 8,500',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Created service in DRAFT status' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateServiceSchema)) dto: CreateServiceDto,
  ) {
    return this.servicesService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service (only DRAFT or REJECTED services can be edited)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiBody({
    schema: {
      example: { title: 'Updated Service Title', priceInfo: 'From LKR 9,000' },
    },
  })
  @ApiResponse({ status: 200, description: 'Updated service' })
  @ApiResponse({ status: 400, description: 'Service is not editable in its current status' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateServiceSchema)) dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service (only DRAFT services can be deleted)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Service is not in DRAFT status' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.remove(id, user.id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a DRAFT service for verification (provider must be VERIFIED)',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service is now PENDING_VERIFICATION' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 403, description: 'Provider is not VERIFIED' })
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.servicesService.submit(id, user.id);
  }
}
