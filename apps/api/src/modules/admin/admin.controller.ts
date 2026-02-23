import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRoles } from 'src/generated/prisma/enums';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { Roles } from 'src/common/decorators';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
export class AdminController {
  constructor(private readonly adminServicer: AdminService) {}

  @Get('/users')
  async getAllUsers(@Query() query: UserPaginationDto) {
    return await this.adminServicer.getAllUsers(query);
  }
}
