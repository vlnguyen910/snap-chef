import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/db/prisma.service';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async create(payload: CreateUserDto) {
    const user = await this.prismaService.user.create({
      data: { ...payload },
    });

    return {
      message: 'User created',
      user,
    };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findFirst({
      where: { email },
    });
  }
}
