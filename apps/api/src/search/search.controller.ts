import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { SearchServicesSchema, SearchServicesDto } from '@marketplace/shared';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('services')
  @ApiOperation({
    summary: 'Search ACTIVE services by proximity (PostGIS ST_DWithin / ST_Distance)',
    description:
      'Returns ACTIVE services from VERIFIED providers within radiusKm, ordered by distance ascending. ' +
      'Optionally filter by categoryId, vertical, or text (ILIKE on title/description).',
  })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude of search center (-90..90)' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude of search center (-180..180)' })
  @ApiQuery({ name: 'radiusKm', required: true, description: 'Search radius in kilometres (max 500)' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'vertical', required: false, enum: ['CONSULTATION', 'VEHICLE_SERVICE'] })
  @ApiQuery({ name: 'text', required: false, description: 'Text search on title / description (ILIKE)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page (default 20, max 100)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated service list with distance_m and distance_km',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            title: 'Full Car Service',
            distance_m: 1234,
            distance_km: 1.23,
          },
        ],
        meta: { total: 42, page: 1, limit: 20, totalPages: 3 },
      },
    },
  })
  search(@Query(new ZodValidationPipe(SearchServicesSchema)) query: SearchServicesDto) {
    return this.searchService.searchServices(query);
  }
}
