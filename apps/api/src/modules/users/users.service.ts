import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import {
  NotificationResourceType,
  NotificationType,
  User,
} from 'src/generated/prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserWhereInput } from 'src/generated/prisma/models';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationMessages, ErrorMessages } from 'src/common/constants';

export interface TopUserItem {
  id: string;
  username: string;
  avatar_url: string | null;
  follower_count: number;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notificationService: NotificationService,
  ) {}

  async create(payload: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: { ...payload },
    });

    return user;
  }

  async findAll(query: UserPaginationDto, current_user_id?: string) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const whereCondition: UserWhereInput = {
      is_active: true,
    };

    if (current_user_id) {
      whereCondition.id = { not: current_user_id };

      const blockedIds = await this.getBlockedUserIds(current_user_id);
      if (blockedIds.length > 0) {
        whereCondition.id.notIn = blockedIds;
      }
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
        followedBy: { _count: 'desc' },
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
      },
    });

    return users;
  }

  async getTopUsers(limit: number = 5): Promise<TopUserItem[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 20)
      : 5;

    const users = await this.prisma.user.findMany({
      where: { is_active: true },
      take: safeLimit,
      orderBy: {
        followedBy: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        _count: {
          select: {
            followedBy: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      follower_count: user._count.followedBy,
    }));
  }

  async findOne(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;
    let user = await this.redis.getCache<User>(cacheKey);

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

  async update(id: string, user_id: string, payload: UpdateUserDto) {
    const cacheKey = `user:${id}`;
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    if (user.id !== user_id)
      throw new UnauthorizedException(ErrorMessages.NO_PERMISSION);

    await this.redis.delCache(cacheKey);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { ...payload },
    });

    return updatedUser;
  }

  async followUser(current_id: string, following_id: string) {
    const currentUser = await this.findOne(current_id);
    const followingUser = await this.findOne(following_id);

    if (!currentUser || !followingUser)
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    // Check if either user has blocked the other
    const isBlocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blocker_id: current_id, blocked_id: following_id },
          { blocker_id: following_id, blocked_id: current_id },
        ],
      },
    });

    if (isBlocked) {
      throw new BadRequestException('Cannot follow this user');
    }

    let isFollowed: boolean | null = null;
    const followedUser = await this.prisma.follow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: current_id,
          following_id,
        },
      },
    });

    if (!followedUser) {
      await this.prisma.follow.create({
        data: {
          follower_id: current_id,
          following_id,
        },
      });

      isFollowed = true;
    } else {
      await this.prisma.follow.delete({
        where: {
          follower_id_following_id: {
            follower_id: current_id,
            following_id,
          },
        },
      });
      isFollowed = false;
    }

    //Trigger notification
    if (isFollowed) {
      await this.notificationService.createNotification({
        receiverId: following_id,
        senderId: current_id,
        type: NotificationType.FOLLOW,
        message: NotificationMessages.NEW_FOLLOW(followingUser.username),
        resourceId: following_id,
        resourceType: NotificationResourceType.USER,
      });
    }

    const message = isFollowed
      ? 'You have followed this user'
      : 'You have unfollowed this user';
    return {
      message,
    };
  }

  async blockUser(current_id: string, target_id: string) {
    if (current_id === target_id) {
      throw new BadRequestException('You cannot block yourself');
    }

    const targetUser = await this.findOne(target_id);
    if (!targetUser) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: current_id,
          blocked_id: target_id,
        },
      },
    });

    if (existingBlock) {
      throw new BadRequestException('User is already blocked');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Create block record
      await tx.block.create({
        data: {
          blocker_id: current_id,
          blocked_id: target_id,
        },
      });

      // 2. Remove follow relation where current user follows target user
      await tx.follow.deleteMany({
        where: {
          follower_id: current_id,
          following_id: target_id,
        },
      });

      // 3. Remove follow relation where target user follows current user
      await tx.follow.deleteMany({
        where: {
          follower_id: target_id,
          following_id: current_id,
        },
      });
    });

    return { message: 'User blocked successfully' };
  }

  async unblockUser(current_id: string, target_id: string) {
    const existingBlock = await this.prisma.block.findUnique({
      where: {
        blocker_id_blocked_id: {
          blocker_id: current_id,
          blocked_id: target_id,
        },
      },
    });

    if (!existingBlock) {
      throw new BadRequestException('User is not blocked');
    }

    await this.prisma.block.delete({
      where: {
        blocker_id_blocked_id: {
          blocker_id: current_id,
          blocked_id: target_id,
        },
      },
    });

    return { message: 'User unblocked successfully' };
  }

  async getBlockedUserIds(user_id: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ blocker_id: user_id }, { blocked_id: user_id }],
      },
      select: {
        blocker_id: true,
        blocked_id: true,
      },
    });

    const blockedIds = new Set<string>();
    for (const block of blocks) {
      if (block.blocker_id !== user_id) blockedIds.add(block.blocker_id);
      if (block.blocked_id !== user_id) blockedIds.add(block.blocked_id);
    }

    return Array.from(blockedIds);
  }

  async getLikedRecipes(user_id: string) {
    const user = await this.findOne(user_id);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    return await this.prisma.like.findMany({
      where: { user_id },
      select: { recipe: true },
    });
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
          },
        },
      },
    });

    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, _count, ...userData } = user;
    return {
      ...userData,
      followers_count: _count.followedBy,
      following_count: _count.following,
      recipes_count: _count.recipe,
    };
  }

  async getPublicProfile(target_id: string, current_id: string | undefined) {
    if (current_id) {
      const isBlocked = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blocker_id: current_id, blocked_id: target_id },
            { blocker_id: target_id, blocked_id: current_id },
          ],
        },
      });

      if (isBlocked) {
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      }
    }

    const targetUser = await this.getCurrentProfile(target_id);
    if (!targetUser) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    let isFollowed = false;
    if (current_id) {
      const followingUser = await this.prisma.follow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: current_id,
            following_id: target_id,
          },
        },
      });

      if (followingUser) isFollowed = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email: _email, role: _role, ...userData } = targetUser;
    return {
      user: userData,
      is_followed: isFollowed,
    };
  }

  async getFollowers(
    profile_id: string,
    current_user_id: string | undefined,
    query: UserPaginationDto,
  ) {
    const profile = await this.findOne(profile_id);
    if (!profile) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    if (current_user_id) {
      const currentUser = await this.findOne(current_user_id);
      if (!currentUser)
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    let blockedIds: string[] = [];
    if (current_user_id) {
      blockedIds = await this.getBlockedUserIds(current_user_id);
    }

    const followers = await this.prisma.follow.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      where: {
        following_id: profile_id,
        ...(blockedIds.length > 0 && {
          follower_id: { notIn: blockedIds },
        }),
      },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            followedBy: current_user_id
              ? {
                  where: { follower_id: current_user_id },
                  select: { follower_id: true },
                }
              : false,
          },
        },
      },
    });

    return followers.map((item) => {
      const targetUser = item.follower;

      const isFollowing = current_user_id
        ? targetUser.followedBy.length > 0
        : false;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { followedBy: _followedBy, ...userData } = targetUser;

      return {
        ...userData,
        is_following: isFollowing,
      };
    });
  }

  async getFollowing(
    profile_id: string,
    current_user_id: string | undefined,
    query: UserPaginationDto,
  ) {
    const user = await this.findOne(profile_id);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    if (current_user_id) {
      const currentUser = await this.findOne(current_user_id);
      if (!currentUser)
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    let blockedIds: string[] = [];
    if (current_user_id) {
      blockedIds = await this.getBlockedUserIds(current_user_id);
    }

    const following = await this.prisma.follow.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      where: {
        follower_id: profile_id,
        ...(blockedIds.length > 0 && {
          following_id: { notIn: blockedIds },
        }),
      },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            followedBy: current_user_id
              ? {
                  where: { follower_id: current_user_id },
                  select: { follower_id: true },
                }
              : false,
          },
        },
      },
    });

    return following.map((item) => {
      const targetUser = item.following;

      const isFollowing = current_user_id
        ? targetUser.followedBy.length > 0
        : false;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { followedBy: _followedBy, ...userData } = targetUser;

      return {
        ...userData,
        is_following: isFollowing,
      };
    });
  }
}
