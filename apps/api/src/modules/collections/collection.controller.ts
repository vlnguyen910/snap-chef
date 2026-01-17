import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/user.decorator';
import type { Collection, User } from 'src/generated/prisma/client';
import { CollectionService } from './collection.service';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @GetUser() user: User,
    @Body() payload: CreateCollectionDto,
  ): Promise<Collection> {
    return await this.collectionService.create(user.id, payload);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('user/:user_id')
  async getUserCollections(
    @Param('user_id') user_id: string,
    @GetUser() currentUser?: User | null,
  ) {
    return await this.collectionService.getUserCollection(user_id, currentUser?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getCollectionDetail(
    @Param('id') id: string,
    @GetUser() currentUser?: User | null,
  ) {
    return await this.collectionService.findOne(id, currentUser?.id);
  }
}
