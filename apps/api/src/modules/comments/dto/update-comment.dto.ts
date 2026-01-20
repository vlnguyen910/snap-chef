import { PartialType } from '@nestjs/mapped-types';
import { CreateCommentsDto } from './create-comments.dto';

export class UpdateCommentDto extends PartialType(CreateCommentsDto) {}
