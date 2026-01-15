import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/user.decorator';
import type { Colleciton, User } from 'src/generated/prisma/client';
import { CollectionService } from './collection.service';

@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @GetUser() user: User,
    @Body() payload: CreateCollectionDto,
  ): Promise<Colleciton> {
    return await this.collectionService.create(user.id, payload);
  }
}
