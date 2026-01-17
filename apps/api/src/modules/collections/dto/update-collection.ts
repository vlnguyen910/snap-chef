import { PartialType } from "@nestjs/mapped-types";
import { CreateCollectionDto } from "./create-collection";

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) { }
