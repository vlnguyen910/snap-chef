import { Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { RecipesModule } from './modules/recipes/recipes.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    CommentsModule,
    RecipesModule, 
    IngredientsModule, 
    AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
