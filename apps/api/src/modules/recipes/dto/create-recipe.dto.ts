import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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

class CreateStepItemDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1, { message: "Step order index must start at 1" })
  order_index!: number;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsUrl()
  @IsOptional()
  image_url?: string;
}

export class CreateRecipeDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(5, { message: "Cooking time must be at least 5 minutes" })
  cooking_time!: number; // in minutes

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: "Servings must be at least 1" })
  servings!: number;

  @IsNotEmpty()
  @IsUrl()
  thumbnail_url!: string;
  
  @IsArray()
  @ArrayMinSize(1, { message: "At least one ingredient is required" })
  @ValidateNested({ each: true })
  @Type(() => IngredientItemDto)
  ingredients!: IngredientItemDto[];

  @IsArray()
  @ArrayMinSize(1, { message: "At least one step is required" })
  @ValidateNested({ each: true })
  @Type(() => CreateStepItemDto)
  steps!: CreateStepItemDto[];
}
