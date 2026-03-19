import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/common/db/prisma.service';
import { generateSlug } from 'src/common/utils/slugify.util';
import { Category } from 'src/generated/prisma/client';
import { ErrorMessages } from 'src/common/constants';

export interface TopCategoryItem {
  id: number;
  name: string;
  slug: string;
  recipe_count: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateCategoryDto) {
    const slug = generateSlug(payload.name);

    const slugExisted = await this.prisma.category.findFirst({
      where: { slug },
    });
    if (slugExisted)
      throw new ConflictException(ErrorMessages.CATEGORY_ALREADY_EXISTS);

    return await this.prisma.category.create({
      data: {
        ...payload,
        slug,
      },
    });
  }

  async findAll(isActiveOnly: boolean = true): Promise<Category[]> {
    return await this.prisma.category.findMany({
      where: isActiveOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async getTopCategories(limit: number = 5): Promise<TopCategoryItem[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 20)
      : 5;

    const categories = await this.prisma.category.findMany({
      where: { is_active: true },
      take: safeLimit,
      orderBy: {
        recipe: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            recipe: true,
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      recipe_count: category._count.recipe,
    }));
  }

  async update(id: number, payload: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);

    let slug: string | undefined;

    if (payload.name) {
      slug = generateSlug(payload.name);
      const existedSlug = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (existedSlug)
        throw new ConflictException(ErrorMessages.CATEGORY_DUPLICATED);

      return await this.prisma.category.update({
        where: { id },
        data: {
          name: payload.name,
          slug,
        },
      });
    }

    return await this.prisma.category.update({
      where: { id },
      data: {
        ...payload,
      },
    });
  }
}
