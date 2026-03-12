import { PartialType } from '@nestjs/swagger';
import { CreateCommentsDto } from './create-comments.dto';

export class UpdateCommentDto extends PartialType(CreateCommentsDto) {}
