import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from 'src/generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReportDto {
  @ApiPropertyOptional({
    description: 'ID of the admin who handles the report',
    example: 'admin-uuid-123',
  })
  @IsOptional()
  @IsString()
  handler_id?: string;

  @ApiPropertyOptional({
    description: 'Current status of the report',
    enum: ReportStatus,
    example: ReportStatus.RESOLVED,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
