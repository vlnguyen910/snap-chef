import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { UserRoles } from 'src/generated/prisma/enums';
import {
  RecipePaginationDto,
  UserPaginationDto,
} from 'src/common/dto/pagination.dto';
import { Roles } from 'src/common/decorators';
import { UserStatusUpdateDto } from './dto/user-status-update.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
export class AdminController {
  constructor(private readonly adminServicer: AdminService) { }

  @Get('/users')
  async getUsers(@Query() query: UserPaginationDto) {
    return await this.adminServicer.getUsers(query);
  }

  @Put('/users/:id/status')
  async updateUserStatus(
    @Param('id') user_id: string,
    @Body() userStatusUpdateDto: UserStatusUpdateDto,
  ) {
    return await this.adminServicer.updateUserStatus(
      user_id,
      userStatusUpdateDto,
    );
  }

  @Get('/recipes')
  async getRecipes(@Query() query: RecipePaginationDto) {
    return await this.adminServicer.getAllRecipes(query);
  }

  @Delete('/recipes/:id')
  async deleteRecipe(@Param('id') recipe_id: string) {
    return await this.adminServicer.deleteRecipe(recipe_id);
  }
}
