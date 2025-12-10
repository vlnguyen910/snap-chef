/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { PrismaService } from 'src/db/prisma.service';
import { Ingredient, Prisma } from 'src/generated/prisma/client';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateIngredientDto): Promise<Ingredient> {
    const cleanName = dto.name.trim().toLowerCase();

    const ingredient = await this.prisma.ingredient.create({
      data: {
        name: cleanName,
      },
    });
    return ingredient;
  }

  findAll() {
    return `This action returns all ingredients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ingredient`;
  }

  async findOneByName(name: string): Promise<Ingredient | null> {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { name },
    });
    return ingredient;
  }

  update(id: number, updateIngredientDto: UpdateIngredientDto) {
    return `This action updates a #${id} ingredient`;
  }

  async upsertByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Ingredient> {
    const client = tx || this.prisma;

    const cleanName = name.trim().toLowerCase();

    return await client.ingredient.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    });
  }

  remove(id: number) {
    return `This action removes a #${id} ingredient`;
  }
}
