import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create ingredient',
    description: 'Add a new ingredient to the database.',
  })
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all ingredients',
    description: 'Retrieve a list of all ingredients.',
  })
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get ingredient',
    description: 'Retrieve a specific ingredient by ID.',
  })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update ingredient',
    description: 'Update an existing ingredient by ID.',
  })
  update(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(+id, updateIngredientDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete ingredient',
    description: 'Remove an ingredient from the database by ID.',
  })
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(+id);
  }
}
