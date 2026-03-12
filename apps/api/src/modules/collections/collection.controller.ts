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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Collections')
@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @GetUser() user: TokenPayload,
    @Body() payload: CreateCollectionDto,
  ): Promise<Collection> {
    return await this.collectionService.create(user.sub, payload);
  }

  @ApiOperation({ summary: 'Get collections by user ID' })
  @ApiResponse({ status: 200, description: 'Return list of collections' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('user/:user_id')
  async getUserCollections(
    @Param('user_id') user_id: string,
    @GetUser() currentUser?: TokenPayload | null,
  ) {
    return await this.collectionService.getUserCollection(
      user_id,
      currentUser?.sub,
    );
  }

  @ApiOperation({ summary: 'Get collection details by ID' })
  @ApiResponse({ status: 200, description: 'Return collection details' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getCollectionDetail(
    @Param('id') id: string,
    @GetUser() currentUser?: TokenPayload | null,
  ) {
    return await this.collectionService.findOne(id, currentUser?.sub);
  }

  @ApiOperation({ summary: 'Add a recipe to a collection' })
  @ApiResponse({ status: 200, description: 'Recipe added successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/recipe/:recipe_id')
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

  @ApiOperation({ summary: 'Update a collection' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
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
