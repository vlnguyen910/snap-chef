import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateCollectionDto } from './dto/create-collection';
import { Colleciton } from 'src/generated/prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class CollectionService {
  constructor(
    private prisma: PrismaService,
    private userServicer: UsersService,
  ) { }

  async create(
    user_id: string,
    payload: CreateCollectionDto,
  ): Promise<Colleciton> {
    return await this.prisma.colleciton.create({
      data: {
        ...payload,
        owner_id: user_id,
      },
    });
  }

  async getUserCollection(owner_id: string, current_user_id?: string | null) {
    const owner = await this.userServicer.findOne(owner_id);
    if (!owner)
      throw new NotFoundException('User is not exist');
    if (current_user_id) {
      const currentUser = await this.userServicer.findOne(current_user_id);
      if (!currentUser)
        throw new NotFoundException('User is not exist');
    }

    const isOwner = owner_id === current_user_id;

    return await this.prisma.colleciton.findMany({
      where: {
        owner_id,
        ...(isOwner ? {} : { is_public: true }),
      },
      orderBy: { updated_at: 'desc' },
    })
  }
}
