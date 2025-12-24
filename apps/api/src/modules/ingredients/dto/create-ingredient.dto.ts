import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateIngredientDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class IngredientItemDto {
  @IsString()
  name!: string;

  @IsNumber() 
  @IsPositive({ message: "Quantity must be a greater than 0" })
  quantity!: number;

  @IsString()
  unit!: string;
}
