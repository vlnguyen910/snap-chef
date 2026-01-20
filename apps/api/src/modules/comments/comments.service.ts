import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type { Comment } from 'src/generated/prisma/client';
import { CommentPaginationDto } from 'src/common/dto/pagination.dto';
import { NotificationMessages } from 'src/common/constants';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationType,
  NotificationResourceType,
} from 'src/generated/prisma/enums';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private logger = new Logger(CommentsService.name);

  async create(user_id: string, recipe_id: string, dto: CreateCommentsDto) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipe_id },
    });
    if (!recipe) throw new NotFoundException('Recipe is not exist');

    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
    });
    if (!user) throw new NotFoundException('User is not exist');

    await this.prisma.comment.create({
      data: {
        user_id,
        recipe_id,
        content: dto.content,
        rating: dto.rating,
      },
    });
    this.logger.log(
      `New comment of recipe ${recipe_id} was created by user ${user_id}`,
    );
    await this.notificationService.createNotification({
      receiverId: recipe.author_id,
      senderId: user_id,
      type: NotificationType.COMMENT,
      message: NotificationMessages.NEW_COMMENT(user.username, recipe.title),
      resourceId: recipe_id,
      resourceType: NotificationResourceType.RECIPE,
    });
    return {
      message: 'Comment Created',
    };
  }

  async findOneById(id: number) {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        recipe: true,
      },
    });
  }

  async findAllCommentsOfRecipe(
    recipe_id: string,
    query: CommentPaginationDto,
  ) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: { recipe_id },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });

    return comments;
  }

  async deleteComment(id: number, user_id: string) {
    const comment = await this.findOneById(id);
    if (!comment) throw new NotFoundException('Comment is not exist');
    if (comment.user_id !== user_id && comment.recipe.author_id !== user_id)
      throw new UnauthorizedException(
        'You not have right to delete this comment',
      );

    await this.prisma.comment.delete({
      where: { id },
    });

    return {
      message: 'Comment deleted',
    };
  }

  async updateComment(id: number, user_id: string, dto: UpdateCommentDto) {
    const comment = await this.findOneById(id);
    if (!comment) throw new NotFoundException('Comment is not exist');
    if (comment.user_id !== user_id)
      throw new UnauthorizedException(
        'You not have right to update this comment',
      );

    await this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        rating: dto.rating,
      },
    });

    return {
      message: 'Comment Updated',
    };
  }
}
