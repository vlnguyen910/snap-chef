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
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { TokenPayload } from 'src/common/interfaces';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentsDto } from '../comments/dto/create-comments.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import {
  CommentPaginationDto,
  RecipePaginationDto,
} from 'src/common/dto/pagination.dto';

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetUser() user: TokenPayload, @Body() createRecipeDto: CreateRecipeDto) {
    return this.recipesService.create(user.sub, createRecipeDto);
  }

  @Get()
  findAll(@Query() query: RecipePaginationDto) {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @GetUser() user: TokenPayload | undefined) {
    return this.recipesService.findOne(id, user?.sub);
  }

  @Get('user/:id')
  getUserRecipes(@Param('id') user_id: string) {
    return this.recipesService.getUserRecipes(user_id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: TokenPayload,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, user.sub, updateRecipeDto);
  }

  //Social Features
  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  likeRecipe(@GetUser() user: TokenPayload, @Param('id') recipe_id: string) {
    return this.recipesService.likeRecipe(user.sub, recipe_id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  createComment(
    @GetUser() user: TokenPayload,
    @Param('id') recipe_id: string,
    @Body() dto: CreateCommentsDto,
  ) {
    return this.commentsService.create(user.sub, recipe_id, dto);
  }

  @Get(':id/comments')
  getAllCommentsOfRecipe(
    @Param('id') recipe_id: string,
    @Query() query: CommentPaginationDto,
  ) {
    return this.commentsService.findAllCommentsOfRecipe(recipe_id, query);
  }

  @Delete(':id/comments/:comment_id')
  @UseGuards(AuthGuard('jwt'))
  deleteComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: TokenPayload,
  ) {
    return this.commentsService.deleteComment(id, user.sub);
  }

  @Patch(':id/comments/:comment_id')
  @UseGuards(AuthGuard('jwt'))
  updateComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: TokenPayload,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, user.sub, dto);
  }
}
