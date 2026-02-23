import { Injectable } from '@nestjs/common';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import { UserRoles } from 'src/generated/prisma/enums';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(query: UserPaginationDto) {
    const { limit, page } = query;
    const skip = (page - 1) * limit;

    const userList = await this.prisma.user.findMany({
      where: {
        role: UserRoles.USER || UserRoles.MODERATOR,
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
}
