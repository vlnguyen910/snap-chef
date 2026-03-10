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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRoles } from 'src/generated/prisma/enums';
import {
  RecipePaginationDto,
  UserPaginationDto,
} from 'src/common/dto/pagination.dto';
import { Roles } from 'src/common/decorators';
import { UserStatusUpdateDto } from './dto/user-status-update.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
export class AdminController {
  constructor(private readonly adminServicer: AdminService) {}

  @Get('/users')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users.',
  })
  async getUsers(@Query() query: UserPaginationDto) {
    return await this.adminServicer.getUsers(query);
  }

  @Put('/users/:id/status')
  @ApiOperation({
    summary: 'Update user status',
    description:
      'Update the status (e.g., active, blocked) of a specific user.',
  })
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
  @ApiOperation({
    summary: 'Get all recipes',
    description: 'Retrieve a paginated list of all recipes.',
  })
  async getRecipes(@Query() query: RecipePaginationDto) {
    return await this.adminServicer.getAllRecipes(query);
  }

  @Delete('/recipes/:id')
  @ApiOperation({
    summary: 'Delete a recipe',
    description: 'Permanently delete a recipe by its ID as an administrator.',
  })
  async deleteRecipe(@Param('id') recipe_id: string) {
    return await this.adminServicer.deleteRecipe(recipe_id);
  }
}
