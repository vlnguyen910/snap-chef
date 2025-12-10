import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaModule } from 'src/db/prisma.module';
import { IngredientsModule } from '../ingredients/ingredients.module';

@Module({
  imports: [PrismaModule, IngredientsModule],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
