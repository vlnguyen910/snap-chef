import { 
  Injectable, 
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from 'src/db/prisma.service';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
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
  
  async findOneById(id: number): Promise<Comment | null> {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        recipe: true,
      }
    })
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

  async deleteComment(id: number, user_id: string) {
    const comment = await this.findOneById(id);
    if (!comment) throw new NotFoundException('Comment is not exist');
    if (comment.user_id !== user_id) throw new UnauthorizedException('You not have right to delete this comment');

    const deleledComment = await this.prisma.comment.delete({
      where: { id }
    })
    
    return {
      message: "Comment deleted",
    }
  }

  async updateComment(id: number, user_id: string, dto: UpdateCommentDto) {
    const comment = await this.findOneById(id);
    if (!comment) throw new NotFoundException('Comment is not exist');
    if (comment.user_id !== user_id) throw new UnauthorizedException('You not have right to update this comment');

    const deleledComment = await this.prisma.comment.update({
      where: { id },
      data: { 
        content: dto.content,
        rating: dto.rating,
      }
    })
    
    return {
      message: "Comment Updated",
    }
  }
}
