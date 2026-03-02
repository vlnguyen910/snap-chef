import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRoles } from 'src/generated/prisma/enums';
import { Roles } from 'src/common/decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Roles(UserRoles.USER)
  @Post()
  create(@Body() payload: CreateReportDto) {
    return this.reportsService.create(payload);
  }

  @Roles(UserRoles.ADMIN)
  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Roles(UserRoles.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Roles(UserRoles.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }
}
