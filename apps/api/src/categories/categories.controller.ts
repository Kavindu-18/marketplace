import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all service categories, optionally filtered by vertical' })
  @ApiQuery({ name: 'vertical', enum: ['CONSULTATION', 'VEHICLE_SERVICE'], required: false })
  @ApiResponse({ status: 200, description: 'Category list with immediate children' })
  findAll(@Query('vertical') vertical?: string) {
    return this.categoriesService.findAll(vertical);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category with its parent and children' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category detail' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
