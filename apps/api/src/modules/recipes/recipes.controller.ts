import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentsDto } from '../comments/dto/create-comments.dto';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@GetUser() user: User, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(user.id, createRecipeDto);
  }

  @Get()
  findAll() {
    return this.recipesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, updateRecipeDto);
  }
  
  //Social Features
  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  likeRecipe(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) recipe_id: number
  ) {
    return this.recipesService.likeRecipe(user.id, recipe_id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  createComment(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) recipe_id: number,
    @Body() dto: CreateCommentsDto,
  ) {
    return this.commentsService.create(user.id, recipe_id, dto);
  }

}
