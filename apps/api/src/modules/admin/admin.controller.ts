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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
export class AdminController {
  constructor(private readonly adminServicer: AdminService) {}

  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Return list of users' })
  @Get('/users')
  async getUsers(@Query() query: UserPaginationDto) {
    return await this.adminServicer.getUsers(query);
  }

  @ApiOperation({ summary: 'Update user status (active/inactive)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
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

  @ApiOperation({ summary: 'Get all recipes with pagination' })
  @ApiResponse({ status: 200, description: 'Return list of recipes' })
  @Get('/recipes')
  async getRecipes(@Query() query: RecipePaginationDto) {
    return await this.adminServicer.getAllRecipes(query);
  }

  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiResponse({ status: 200, description: 'Recipe deleted successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @Delete('/recipes/:id')
  async deleteRecipe(@Param('id') recipe_id: string) {
    return await this.adminServicer.deleteRecipe(recipe_id);
  }
}
