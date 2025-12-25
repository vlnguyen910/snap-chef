import { 
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/db/prisma.service';
import { User } from 'src/generated/prisma/client';

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
}
