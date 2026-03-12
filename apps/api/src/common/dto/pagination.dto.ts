import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PAGINATION } from 'src/common/constants/pagination.constrant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

//Base dto
class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: PAGINATION.DEFAULT_PAGE,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: PAGINATION.MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit!: number;

  @ApiPropertyOptional({
    description: 'Search string',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class RecipePaginationDto extends PaginationDto {
  @ApiProperty({
    description: 'Number of recipes per page',
    default: PAGINATION.RECIPES.DEFAULT_LIMIT,
  })
  limit: number = PAGINATION.RECIPES.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Filter by category slugs (comma separated or array)',
    type: [String],
    example: 'breakfast,lunch',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(String);
    return String(value).split(',');
  })
  category_slugs?: string[];
}

export class CommentPaginationDto extends PaginationDto {
  @ApiProperty({
    description: 'Number of comments per page',
    default: PAGINATION.COMMENTS.DEFAULT_LIMIT,
  })
  limit: number = PAGINATION.COMMENTS.DEFAULT_LIMIT;
}

export class UserPaginationDto extends PaginationDto {
  @ApiProperty({
    description: 'Number of users per page',
    default: PAGINATION.USERS.DEFAULT_LIMIT,
  })
  limit: number = PAGINATION.USERS.DEFAULT_LIMIT;
}

