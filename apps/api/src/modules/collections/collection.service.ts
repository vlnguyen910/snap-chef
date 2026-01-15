import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateCollectionDto } from './dto/create-collection';
import { Colleciton } from 'src/generated/prisma/client';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

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
}
