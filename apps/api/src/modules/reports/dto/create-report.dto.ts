import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ReportReason, ReportStatus, TargetReportType } from "src/generated/prisma/enums";

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  reporter_id!: string;

  @IsNotEmpty()
  @IsEnum(TargetReportType)
  target_type!: TargetReportType;

  @IsNotEmpty()
  @IsString()
  target_id!: string;

  @IsNotEmpty()
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsNotEmpty()
  @IsString()
  handler_id!: string;
}
