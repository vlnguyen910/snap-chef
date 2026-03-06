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

  async update(id: number, payload: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category)
      throw new NotFoundException(ErrorMessages.CATEGORY_NOT_FOUND);

    if (payload.name) {
      const newSlug = generateSlug(payload.name);
      const existedSlug = await this.prisma.category.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });
      if (existedSlug)
        throw new ConflictException(ErrorMessages.CATEGORY_DUPLICATED);
    }

    return await this.prisma.category.update({
      where: { id },
      data: { ...payload },
    });
  }
}
