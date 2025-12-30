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
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentsDto } from '../comments/dto/create-comments.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard'; 
import { CommentPaginationDto, RecipePaginationDto } from 'src/common/dto/pagination.dto';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: User, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(user.id, createRecipeDto);
  }

  @Get()
  findAll(
    @Query() query: RecipePaginationDto,
  ) {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User | undefined,
  ) {
    return this.recipesService.findOne(id, user?.id);
  }

  @Get('user/:id')
  getUserRecipes(@Param('id') user_id: string) {
    return this.recipesService.getUserRecipes(user_id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, user.id, updateRecipeDto);
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

  @Get(':id/comments')
  getAllCommentsOfRecipe(
    @Param('id', ParseIntPipe) recipe_id: number,
    @Query() query: CommentPaginationDto,
  ) {
    return this.commentsService.findAllCommentsOfRecipe(
      recipe_id,
      query
    );
  }
  
  @Delete(':id/comments/:comment_id')
  @UseGuards(AuthGuard('jwt'))
  deleteComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: User
  ) {
    return this.commentsService.deleteComment(id, user.id);
  }

  @Patch(':id/comments/:comment_id')
  @UseGuards(AuthGuard('jwt'))
  updateComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, user.id, dto);
  }
}
