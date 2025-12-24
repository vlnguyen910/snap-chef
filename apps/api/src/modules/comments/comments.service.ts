import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from 'src/db/prisma.service';
import { CreateCommentsDto } from './dto/create-comments.dto';
import type { Comment } from 'src/generated/prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}
  
  private logger = new Logger(CommentsService.name);

  async create(user_id: string, recipe_id: number, dto: CreateCommentsDto) {
    const newComment = await this.prisma.comment.create({
      data: {
        user_id,
        recipe_id,
        content: dto.content,
        rating: dto.rating,
      }
    });
    this.logger.log(`New comment of recipe ${recipe_id} was created by user ${user_id}`);
    
    return {
      message: "Comment Created",
    }
  }

  async findAllCommentsOfRecipe(recipe_id: number): Promise<Comment []> {
    const comments = await this.prisma.comment.findMany({
      where: { recipe_id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatar_url: true,
            role: true,
          }
        }
      }
    })

    return comments;
  }
}
