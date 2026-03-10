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
import type { Collection } from 'src/generated/prisma/client';
import { CollectionService } from './collection.service';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { UpdateCollectionDto } from './dto/update-collection';
import { TokenPayload } from 'src/common/interfaces';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create collection',
    description: 'Create a new recipe collection for the current user.',
  })
  async create(
    @GetUser() user: TokenPayload,
    @Body() payload: CreateCollectionDto,
  ): Promise<Collection> {
    return await this.collectionService.create(user.sub, payload);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('user/:user_id')
  @ApiOperation({
    summary: 'Get user collections',
    description: 'Retrieve collections created by a specific user.',
  })
  async getUserCollections(
    @Param('user_id') user_id: string,
    @GetUser() currentUser?: TokenPayload | null,
  ) {
    return await this.collectionService.getUserCollection(
      user_id,
      currentUser?.sub,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get collection details',
    description: 'Retrieve details of a specific collection by its ID.',
  })
  async getCollectionDetail(
    @Param('id') id: string,
    @GetUser() currentUser?: TokenPayload | null,
  ) {
    return await this.collectionService.findOne(id, currentUser?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/recipe/:recipe_id')
  @ApiOperation({
    summary: 'Add recipe to collection',
    description: 'Add a recipe to a specific collection.',
  })
  async addRecipeToCollection(
    @Param('id') collection_id: string,
    @Param('recipe_id') recipe_id: string,
    @GetUser() currentUser: TokenPayload,
  ) {
    return await this.collectionService.addRecipe(
      collection_id,
      recipe_id,
      currentUser.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({
    summary: 'Update collection',
    description: 'Update a specific collection owned by the current user.',
  })
  async updateCollection(
    @Param('id') collection_id: string,
    @Body() payload: UpdateCollectionDto,
    @GetUser() currentUser: TokenPayload,
  ) {
    return await this.collectionService.update(
      collection_id,
      payload,
      currentUser.sub,
    );
  }
}
