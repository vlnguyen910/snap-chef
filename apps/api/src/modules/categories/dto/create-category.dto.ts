import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Italian',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Whether the category is active and visible',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_active!: boolean;
}
