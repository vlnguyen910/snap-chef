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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(UserRoles.USER)
  @Post()
  @ApiOperation({
    summary: 'Create report',
    description: 'Submit a new report as an authenticated user.',
  })
  create(@GetUser() user: TokenPayload, @Body() payload: CreateReportDto) {
    return this.reportsService.create(user.sub, payload);
  }

  @Roles(UserRoles.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Get all reports',
    description: 'Retrieve a list of all reports. Admin only.',
  })
  findAll() {
    return this.reportsService.findAll();
  }

  @Roles(UserRoles.ADMIN)
  @Get(':id')
  @ApiOperation({
    summary: 'Get report details',
    description:
      'Retrieve detailed information of a specific report. Admin only.',
  })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update report',
    description: 'Update an existing report. Admin only.',
  })
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }
}
