import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  thumbnail?: string | null;

  @IsOptional()
  @IsBoolean()
  is_public: boolean = false;
}
