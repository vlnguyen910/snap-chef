import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import { Report } from 'src/generated/prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(dto: CreateReportDto) {
    return await this.prisma.report.create({
      data: {
        ...dto,
      }
    });
  }

  async findAll() {
    return await this.prisma.report.findMany();
  }

  async findOne(id: string): Promise<Report | null> {
    return await this.prisma.report.findUnique({
      where: { id },
    })
  }

  async update(id: string, payload: UpdateReportDto) {
    return await this.prisma.report.update({
      where: { id },
      data: { ...payload },
    })
  }
}
