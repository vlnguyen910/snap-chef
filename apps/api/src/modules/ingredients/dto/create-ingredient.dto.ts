import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateIngredientDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class IngredientItemDto {
  @IsString()
  name!: string;

  @IsNumber() // double/float đều là number
  @Min(1)
  quantity!: number;

  @IsString()
  unit!: string;
}
