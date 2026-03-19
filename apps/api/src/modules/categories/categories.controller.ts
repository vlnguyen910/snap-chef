import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService, TopCategoryItem } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRoles } from 'src/generated/prisma/enums';
import { Category } from 'src/generated/prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @Post()
  create(@Body() payload: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(payload);
  }

  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({ status: 200, description: 'Return list of categories' })
  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll(true);
  }

  @ApiOperation({ summary: 'Get top categories by recipe count' })
  @ApiResponse({
    status: 200,
    description: 'Return top categories with recipe_count',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of categories to return',
    example: 5,
  })
  @Get('top')
  getTopCategories(@Query('limit') limit?: string): Promise<TopCategoryItem[]> {
    return this.categoriesService.getTopCategories(limit ? Number(limit) : 5);
  }

  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, payload);
  }
}
