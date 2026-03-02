import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ReportReason, ReportStatus, TargetReportType } from "src/generated/prisma/enums";

export class CreateReportDto {
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
}
