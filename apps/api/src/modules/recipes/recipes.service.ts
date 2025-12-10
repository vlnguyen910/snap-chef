/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { PrismaService } from 'src/db/prisma.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { RecipeStatus } from 'src/generated/prisma/enums';

@Injectable()
export class RecipesService {
  constructor(
    private prisma: PrismaService,
    private ingredientsService: IngredientsService,
  ) {}

  async create(dto: CreateRecipeDto) {
    const recipe = await this.prisma.$transaction(async (tx) => {
      const createdRecipe = await tx.recipe.create({
        data: {
          title: dto.title,
          description: dto.description,
          author_id: dto.author_id,
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
      });

      for (const step of dto.steps) {
        await tx.step.create({
          data: {
            recipe_id: createdRecipe.id,
            order_index: step.order_index,
            image_url: step.image_url,
            content: step.content,
          },
        });
      }

      for (const items of dto.ingredients) {
        const ingredient = await this.ingredientsService.upsertByName(
          items.name,
          tx,
        );

        await tx.recipeIngredient.create({
          data: {
            recipe_id: createdRecipe.id,
            ingredient_id: ingredient.id,
            quantity: items.quanity,
            unit: items.unit,
          },
        });
      }

      return createdRecipe;
    });

    return recipe;
  }

  findAll() {
    return `This action returns all recipes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recipe`;
  }

  update(id: number, updateRecipeDto: UpdateRecipeDto) {
    return `This action updates a #${id} recipe`;
  }

  remove(id: number) {
    return `This action removes a #${id} recipe`;
  }
}
