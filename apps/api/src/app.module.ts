import { Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';

@Module({
  imports: [RecipesModule, IngredientsModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
