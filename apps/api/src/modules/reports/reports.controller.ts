import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRoles } from 'src/generated/prisma/enums';
import { GetUser, Roles } from 'src/common/decorators';
import { TokenPayload } from 'src/common/interfaces';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @Roles(UserRoles.USER)
  @Post()
  create(@GetUser() user: TokenPayload, @Body() payload: CreateReportDto) {
    return this.reportsService.create(user.sub, payload);
  }

  @ApiOperation({ summary: 'Get all reports (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return list of reports' })
  @Roles(UserRoles.ADMIN)
  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @ApiOperation({ summary: 'Get report details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return report details' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @Roles(UserRoles.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update report status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }
}
