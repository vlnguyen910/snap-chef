import { PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection';

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
