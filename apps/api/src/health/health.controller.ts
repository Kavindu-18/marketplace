import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import type { HealthResponse } from '@marketplace/shared';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database health check' })
  @ApiResponse({ status: 200, description: 'Service and DB are healthy' })
  @ApiResponse({ status: 503, description: 'Database unreachable' })
  async check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
