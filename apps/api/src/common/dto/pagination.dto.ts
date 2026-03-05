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

//Base dto
class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.MAX_LIMIT)
  limit!: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export class RecipePaginationDto extends PaginationDto {
  limit: number = PAGINATION.RECIPES.DEFAULT_LIMIT;

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
  limit: number = PAGINATION.COMMENTS.DEFAULT_LIMIT;
}

export class UserPaginationDto extends PaginationDto {
  limit: number = PAGINATION.USERS.DEFAULT_LIMIT;
}
