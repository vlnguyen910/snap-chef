import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRoles } from 'src/generated/prisma/enums';
import { Category } from 'src/generated/prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create category',
    description: 'Create a new recipe category as an administrator.',
  })
  create(@Body() payload: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(payload);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieve a list of all recipe categories.',
  })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll(true);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoles.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Update an existing recipe category by its ID.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, payload);
  }
}
