import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ReportReason, TargetReportType } from 'src/generated/prisma/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({
    description: 'Type of content being reported',
    enum: TargetReportType,
    example: TargetReportType.RECIPE,
  })
  @IsNotEmpty()
  @IsEnum(TargetReportType)
  target_type!: TargetReportType;

  @ApiProperty({
    description: 'ID of the content being reported',
    example: 'recipe-uuid-123',
  })
  @IsNotEmpty()
  @IsString()
  target_id!: string;

  @ApiProperty({
    description: 'Reason for the report',
    enum: ReportReason,
    example: ReportReason.INAPORIATE_CONTENT,
  })
  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({
    description: 'Detailed description of the report',
    example: 'This recipe contains offensive language in the description.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
