import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CreateCollectionDto } from './dto/create-collection';
import { Collection, User } from 'src/generated/prisma/client';
import { UsersService } from '../users/users.service';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class CollectionService {
  constructor(
    private prisma: PrismaService,
    private userServicer: UsersService,
    private recipeService: RecipesService,
  ) { }

  async create(
    user_id: string,
    payload: CreateCollectionDto,
  ): Promise<Collection> {
    return await this.prisma.collection.create({
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

    return await this.prisma.collection.findMany({
      where: {
        owner_id,
        ...(isOwner ? {} : { is_public: true }),
      },
      orderBy: { updated_at: 'desc' },
    })
  }

  async findOne(id: string, current_user_id?: string | null) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
          }
        }
      },
    })

    if (!collection)
      throw new NotFoundException('This collection is not exist');
    if (collection && !collection.is_public && current_user_id !== collection?.owner_id)
      throw new ForbiddenException('Collection is not exist or you have no right to see this');

    return collection;
  }

  async addRecipe(collection_id: string, recipe_id: number, currentUser: User) {
    const collection = await this.findOne(collection_id);
    if (!collection)
      throw new NotFoundException('This collection is not found');

    const recipe = await this.recipeService.findOne(recipe_id);
    if (!recipe)
      throw new NotFoundException('This recipe is not found');

    if (collection.owner_id !== currentUser.id)
      throw new ForbiddenException('You have no right to edit this!');

    await this.prisma.collection.update({
      where: { id: collection_id },
      data: {
        recipe: {
          connect: { id: recipe_id },
        }
      }
    })

    return {
      message: `${recipe.title} has been added to ${collection.name}`
    }
  }
}
