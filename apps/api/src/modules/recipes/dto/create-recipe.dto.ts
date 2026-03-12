import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { IngredientItemDto } from 'src/modules/ingredients/dto/create-ingredient.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateStepItemDto {
  @ApiProperty({
    description: 'Order index of the step (starts at 1)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: 'Step order index must start at 1' })
  order_index!: number;

  @ApiProperty({
    description: 'Content description of the step',
    example: 'Chop the onions and fry until golden brown.',
  })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: 'Optional image URL for the step',
    example: 'https://example.com/step1.jpg',
  })
  @IsUrl()
  @IsOptional()
  image_url?: string;
}

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Title of the recipe',
    example: 'Classic Beef Bourguignon',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Description of the recipe',
    example: 'A hearty French stew with beef, red wine, and vegetables.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Cooking time in minutes (minimum 5)',
    example: 120,
    minimum: 5,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: 'Cooking time must be at least 5 minutes' })
  cooking_time!: number; // in minutes

  @ApiProperty({
    description: 'Number of servings (minimum 1)',
    example: 4,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Servings must be at least 1' })
  servings!: number;

  @ApiProperty({
    description: 'Main image (thumbnail) URL for the recipe',
    example: 'https://example.com/recipe-thumbnail.jpg',
  })
  @IsNotEmpty()
  @IsUrl()
  thumbnail_url!: string;

  @ApiProperty({
    description: 'List of ingredients with quantities and units',
    type: [IngredientItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ingredient is required' })
  @ValidateNested({ each: true })
  @Type(() => IngredientItemDto)
  ingredients!: IngredientItemDto[];

  @ApiProperty({
    description: 'List of preparation steps',
    type: [CreateStepItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one step is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateStepItemDto)
  steps!: CreateStepItemDto[];

  @ApiPropertyOptional({
    description: 'Slugs of categories this recipe belongs to',
    example: ['lunch', 'dinner', 'french'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  category_slugs?: string[];
}
