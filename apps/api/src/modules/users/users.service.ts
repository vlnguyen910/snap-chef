import { 
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/db/prisma.service';
import { User } from 'src/generated/prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(payload: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: { ...payload },
    });

    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { email },
    });
  }

  async followUser(follower_id: string, following_id: string) {
    const followerUser = this.findOne(follower_id);
    const followingUser = this.findOne(following_id);

    if (!followerUser || !followingUser) throw new NotFoundException('User is not exist');
    

    let isFollowed: boolean | null = null;
    const followedUser = await this.prisma.follow.findUnique({
      where: { 
        follower_id_following_id: {
          follower_id,
          following_id,
        }
      } 
    })

    if (!followedUser) {
      await this.prisma.follow.create({
        data: { 
          follower_id,
          following_id,
        }
      })

      isFollowed = true;
    } 
    else {
      await this.prisma.follow.delete({
        where : {
          follower_id_following_id: {
            follower_id,
            following_id,
          }
        }
      })  
      isFollowed = false;
    }

    const message = isFollowed? 'You have followed this user' : 'You have unfollowed this user';
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
      where: {id: user_id}, 
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            recipe: true,
          }
        }
      }
    });

    if (!user) throw new NotFoundException('User not exist');
    
    const {password, _count, ...userData} = user;
    return {
      ...userData,
      followers_count: _count.followers,
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

    const { email, role, ...userWithoutSensitiveInfo } = targetUser;
    return {
      user: userWithoutSensitiveInfo,
      is_followed: isFollowed,
    }
  }

  async update(id: string, user_id: string, payload: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!user) throw new NotFoundException('User is not exist');
    if (user.id !== user_id) 
      throw new UnauthorizedException('You have no right to perform this action');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { ...payload },
    });

    return updatedUser;  
  }
}
