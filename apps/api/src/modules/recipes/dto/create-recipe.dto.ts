import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { IngredientItemDto } from 'src/modules/ingredients/dto/create-ingredient.dto';

class CreateStepItemDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
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

  @IsOptional()
  @IsUUID()
  author_id?: string | null;

  @IsNotEmpty()
  @IsInt()
  cooking_time!: number; // in minutes

  @IsNotEmpty()
  @IsInt()
  servings!: number;

  @IsNotEmpty()
  @IsUrl()
  thumbnail_url!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientItemDto)
  ingredients!: IngredientItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStepItemDto)
  steps!: CreateStepItemDto[];
}
