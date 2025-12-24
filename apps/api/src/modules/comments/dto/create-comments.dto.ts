import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsInt,
  Min,
  Max
} from "class-validator";

export class CreateCommentsDto {
  @IsOptional()
  @IsString()
  content?: string;
  
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(5)
  rating!: number
}
