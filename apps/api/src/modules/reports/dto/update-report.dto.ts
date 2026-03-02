import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from 'src/generated/prisma/enums';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  handler_id?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
