import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Name of the collection',
    example: 'Favorite Italian Recipes',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the collection',
    example: 'A collection of my favorite pizza and pasta recipes.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Optional thumbnail image URL for the collection',
    example: 'https://example.com/collection-thumbnail.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  thumbnail?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the collection is public or private',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_public: boolean = false;
}
