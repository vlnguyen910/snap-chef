import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/db/prisma.service';
import { User } from 'src/generated/prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserWhereInput } from 'src/generated/prisma/models';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { fa } from '@faker-js/faker';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) { }

  async create(payload: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: { ...payload },
    });

    return user;
  }

  async findAll(query: UserPaginationDto, current_user_id?: string | undefined) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const whereCondition: UserWhereInput = {
      is_active: true,
    }

    if (current_user_id) {
      whereCondition.id = { not: current_user_id };
    }

    if (search) {
      whereCondition.OR = [
        {
          username: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: {
        followedBy: { _count: 'desc' }
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
      }
    })

    return users;
  }

  async findOne(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;
    let user = await this.redis.getCache(cacheKey);

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id },
      });

      await this.redis.setCache(cacheKey, user, 60);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { email },
    });
  }

  async followUser(current_id: string, following_id: string) {
    const currentUser = this.findOne(current_id);
    const followingUser = this.findOne(following_id);

    if (!currentUser || !followingUser) throw new NotFoundException('User is not exist');


    let isFollowed: boolean | null = null;
    const followedUser = await this.prisma.follow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: current_id,
          following_id,
        }
      }
    })

    if (!followedUser) {
      await this.prisma.follow.create({
        data: {
          follower_id: current_id,
          following_id,
        }
      })

      isFollowed = true;
    }
    else {
      await this.prisma.follow.delete({
        where: {
          follower_id_following_id: {
            follower_id: current_id,
            following_id,
          }
        }
      })
      isFollowed = false;
    }

    const message = isFollowed ? 'You have followed this user' : 'You have unfollowed this user';
    return {
      message,
    }
  }

  async getLikedRecipes(user_id: string) {
    const user = await this.findOne(user_id);
    if (!user) throw new NotFoundException('User is not exist');

    return await this.prisma.like.findMany({
      where: { user_id },
      select: { recipe: true },
    })
  }

  async getCurrentProfile(user_id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
      include: {
        _count: {
          select: {
            followedBy: true,
            following: true,
            recipe: true,
          }
        }
      }
    });

    if (!user) throw new NotFoundException('User not exist');

    const { password, _count, ...userData } = user;
    return {
      ...userData,
      followers_count: _count.followedBy,
      following_count: _count.following,
      recipes_count: _count.recipe,
    }
  }

  async getPublicProfile(target_id: string, current_id: string | undefined) {
    const targetUser = await this.getCurrentProfile(target_id);
    if (!targetUser) throw new NotFoundException('User is not exist,');

    let isFollowed = false;
    if (current_id) {
      const followingUser = await this.prisma.follow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: current_id,
            following_id: target_id,
          }
        }
      });

      if (followingUser) isFollowed = true;
    }

    const { email, role, ...userData } = targetUser;
    return {
      user: userData,
      is_followed: isFollowed,
    }
  }

  async update(id: string, user_id: string, payload: UpdateUserDto) {
    const cacheKey = `user:id`;
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException('User is not exist');
    if (user.id !== user_id)
      throw new UnauthorizedException('You have no right to perform this action');

    await this.redis.delCache(cacheKey);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { ...payload },
    });

    return updatedUser;
  }

  async getFollowers(
    profile_id: string,
    current_user_id: string | undefined,
    query: UserPaginationDto
  ) {
    const profile = this.findOne(profile_id);
    if (!profile) throw new NotFoundException('User is not exist');
    if (current_user_id) {
      const currentUser = this.findOne(current_user_id);
      if (!currentUser) throw new NotFoundException('User is not exist');
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const followers = await this.prisma.follow.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      where: { following_id: profile_id },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            followedBy: current_user_id ? {
              where: { follower_id: current_user_id },
              select: { follower_id: true },
            } : false,
          },
        },
      },
    });

    return followers.map((item) => {
      const targetUser = item.follower;

      const isFollowing = current_user_id
        ? targetUser.followedBy.length > 0
        : false;

      const { followedBy, ...userData } = targetUser;

      return {
        ...userData,
        is_following: isFollowing,
      };
    });
  }

  async getFollowing(
    profile_id: string,
    current_user_id: string | undefined,
    query: UserPaginationDto
  ) {
    const user = this.findOne(profile_id);
    if (!user) throw new NotFoundException('User is not exist');
    if (current_user_id) {
      const currentUser = this.findOne(current_user_id);
      if (!currentUser) throw new NotFoundException('User is not exist');
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const following = await this.prisma.follow.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      where: { follower_id: profile_id },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            followedBy: current_user_id ? {
              where: { follower_id: current_user_id },
              select: { follower_id: true },
            } : false,
          },
        },
      },
    });

    return following.map((item) => {
      const targetUser = item.following;

      const isFollowing = current_user_id
        ? targetUser.followedBy.length > 0
        : false;

      const { followedBy, ...userData } = targetUser;

      return {
        ...userData,
        is_following: isFollowing,
      };
    });
  }
}
