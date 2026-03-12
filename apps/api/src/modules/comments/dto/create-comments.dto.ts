import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentsDto {
  @ApiPropertyOptional({
    description: 'Text content of the comment',
    example: 'This recipe is amazing! I loved the flavor.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Rating given by the user (0 to 5)',
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  rating!: number;
}
