import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from 'src/db/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeStatus } from 'src/generated/prisma/enums';
import { Recipe, RecipeIngredient } from 'src/generated/prisma/client';
@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
  ) {}

  private validateOrderIndices(orderIndices: number[]): void {
    const sortedIndices = [...orderIndices].sort((a, b) => a - b);

    if (sortedIndices.length === 0) {
      throw new BadRequestException('At least one step is required');
    }

    if (orderIndices.length !== new Set(orderIndices).size) {
      throw new BadRequestException('Order index can not be duplicated');
    }

    if (sortedIndices[0] !== 1) {
      throw new BadRequestException('order_index must start from 1');
    }

    for (let i = 0; i < sortedIndices.length - 1; i++) {
      if (sortedIndices[i + 1] !== sortedIndices[i]! + 1) {
        throw new BadRequestException('Order index must be continuous');
      }
    }
  }

  async create(user_id: string, dto: CreateRecipeDto) {
    const orderIndices = dto.steps.map((step) => step.order_index);
    this.validateOrderIndices(orderIndices);

    return await this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          title: dto.title,
          description: dto.description,
          author_id: user_id,
          cooking_time: dto.cooking_time,
          servings: dto.servings,
          thumbnail_url: dto.thumbnail_url,
          status: RecipeStatus.DRAFT,

          steps: {
            create: dto.steps.map((step) => ({
              order_index: step.order_index,
              image_url: step.image_url,
              content: step.content,
            })),
          },
        },
        include: {
          steps: {
            orderBy: { order_index: 'asc' },
          },
        },
      });

      const recipeIngredients: RecipeIngredient[] = [];
      for (const items of dto.ingredients) {
        // Add new ingredient if it not in db
        const ingredient = await this.ingredientsService.upsertByName(
          items.name,
          tx,
        );

        const recipeIngredient = await tx.recipeIngredient.create({
          data: {
            recipe_id: recipe.id,
            ingredient_id: ingredient.id,
            quantity: items.quanity,
            unit: items.unit,
          },
          include: {
            Ingredient: true,
          },
        });
        recipeIngredients.push(recipeIngredient);
      }

      return {
        recipe,
        ingredients: recipeIngredients,
      };
    });
  }

  async findAll(): Promise<Recipe[]> {
    return await this.prisma.recipe.findMany();
  }

  findOne(id: number): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
    });
  }

  //TODO: add update logic for ingredients and steps
  async update(id: number, updateRecipeDto: UpdateRecipeDto) {
    const { ingredients, steps, ...scalarFields } = updateRecipeDto;

    return await this.prisma.recipe.update({
      where: { id },
      data: scalarFields,
    });
  }
}
