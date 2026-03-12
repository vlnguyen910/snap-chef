import { Injectable, NotFoundException } from '@nestjs/common';
import {
  RecipePaginationDto,
  UserPaginationDto,
} from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import { UserRoles } from 'src/generated/prisma/enums';
import { UsersService } from '../users/users.service';
import { UserStatusUpdateDto } from './dto/user-status-update.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly redis: RedisService,
    private readonly recipeService: RecipesService,
  ) {}

  async getUsers(query: UserPaginationDto) {
    const { limit, page } = query;
    const skip = (page - 1) * limit;

    const userList = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRoles.USER, UserRoles.MODERATOR] },
      },
      skip,
      take: limit,
      omit: {
        password: true,
        avatar_url: true,
        bio: true,
      },
      orderBy: {
        create_at: 'desc',
      },
    });

    return userList;
  }

  async updateUserStatus(user_id: string, dto: UserStatusUpdateDto) {
    const user = await this.userService.findOne(user_id);
    if (!user) throw new NotFoundException('User is not exist!');

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { is_active: dto.status },
      omit: {
        password: true,
        avatar_url: true,
        bio: true,
      },
    });

    await this.redis.delCache(`user:${user.id}`);
    return updatedUser;
  }

  async getAllRecipes(query: RecipePaginationDto) {
    const { limit, page } = query;
    const skip = (page - 1) * limit;

    const recipeList = await this.prisma.recipe.findMany({
      skip,
      take: limit,
      where: { deleted_at: null },
      orderBy: {
        created_at: 'desc',
      },
    });

    return recipeList;
  }

  async deleteRecipe(recipe_id: string) {
    const recipe = await this.recipeService.findOne(recipe_id);
    if (!recipe) throw new NotFoundException('Recipe is not found or exist');

    const now = new Date();
    await this.prisma.recipe.update({
      where: { id: recipe_id },
      data: {
        deleted_at: now,
      },
    });

    await this.redis.delCache(`recipe:${recipe.id}`);

    return {
      message: `Recice ${recipe.title} by ${recipe.user.username} is deleted`,
    };
  }
}
