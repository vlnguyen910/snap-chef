import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { CreateCollectionDto } from './dto/create-collection';
import { Collection } from 'src/generated/prisma/client';
import { UsersService } from '../users/users.service';
import { RecipesService } from '../recipes/recipes.service';
import { UpdateCollectionDto } from './dto/update-collection';
import { ErrorMessages } from 'src/common/constants';

@Injectable()
export class CollectionService {
  constructor(
    private prisma: PrismaService,
    private userServicer: UsersService,
    private recipeService: RecipesService,
  ) {}

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
    if (!owner) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    if (current_user_id) {
      const currentUser = await this.userServicer.findOne(current_user_id);
      if (!currentUser) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    const isOwner = owner_id === current_user_id;

    return await this.prisma.collection.findMany({
      where: {
        owner_id,
        ...(isOwner ? {} : { is_public: true }),
      },
      orderBy: { updated_at: 'desc' },
    });
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
          },
        },
      },
    });

    if (!collection)
      throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);

    if (
      collection &&
      !collection.is_public &&
      current_user_id !== collection.owner_id
    )
      throw new ForbiddenException(ErrorMessages.COLLECTION_FORBIDDEN);

    return collection;
  }

  async addRecipe(collection_id: string, recipe_id: string, user_id: string) {
    const recipe = await this.recipeService.findOne(recipe_id);
    if (!recipe) throw new NotFoundException(ErrorMessages.RECIPE_NOT_FOUND);

    const collection = await this.prisma.collection.findUnique({
      where: { id: collection_id },
      include: {
        recipe: {
          where: { id: recipe_id },
        },
      },
    });

    if (!collection) throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);

    if (collection.owner_id !== user_id)
      throw new ForbiddenException(ErrorMessages.NO_RIGHT_EDIT_COLLECTION);

    const isRecipeInCollection = collection.recipe.length > 0;

    await this.prisma.collection.update({
      where: { id: collection_id },
      data: {
        recipe: {
          [isRecipeInCollection ? 'disconnect' : 'connect']: { id: recipe_id },
        },
      },
    });

    const action = isRecipeInCollection ? 'removed from' : 'added to';

    return {
      message: `${recipe.title} has been ${action} ${collection.name}`,
    };
  }

  async update(
    collection_id: string,
    payload: UpdateCollectionDto,
    user_id: string,
  ) {
    const collection = await this.findOne(collection_id, user_id);
    if (!collection) throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);

    if (collection.owner_id !== user_id)
      throw new ForbiddenException(ErrorMessages.NO_RIGHT_EDIT_COLLECTION);

    return await this.prisma.collection.update({
      where: { id: collection_id },
      data: payload,
    });
  }
}
