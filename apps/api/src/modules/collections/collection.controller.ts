import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/user.decorator';
import type { Collection, User } from 'src/generated/prisma/client';
import { CollectionService } from './collection.service';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { UpdateCollectionDto } from './dto/update-collection';

@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

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
    return await this.collectionService.getUserCollection(
      user_id,
      currentUser?.id,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getCollectionDetail(
    @Param('id') id: string,
    @GetUser() currentUser?: User | null,
  ) {
    return await this.collectionService.findOne(id, currentUser?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/recipe/:recipe_id')
  async addRecipeToCollection(
    @Param('id') collection_id: string,
    @Param('recipe_id') recipe_id: string,
    @GetUser() currentUser: User,
  ) {
    return await this.collectionService.addRecipe(
      collection_id,
      recipe_id,
      currentUser,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCollection(
    @Param('id') collection_id: string,
    @Body() payload: UpdateCollectionDto,
    @GetUser() currentUser: User,
  ) {
    return await this.collectionService.update(
      collection_id,
      payload,
      currentUser,
    );
  }
}
