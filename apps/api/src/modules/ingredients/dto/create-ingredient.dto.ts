import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({
    description: 'Name of the ingredient',
    example: 'Tomato',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class IngredientItemDto {
  @ApiProperty({
    description: 'Name of the ingredient',
    example: 'Salt',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Quantity of the ingredient',
    example: 1.5,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive({ message: 'Quantity must be a greater than 0' })
  quantity!: number;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'tablespoon',
  })
  @IsString()
  unit!: string;
}
