import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from 'src/common/db/prisma.module';
import { UsersModule } from '../users/users.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [PrismaModule, UsersModule, RecipesModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
