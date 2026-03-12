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
import { CommentsService } from '../comments/comments.service';
import { CreateCommentsDto } from '../comments/dto/create-comments.dto';
import { UpdateCommentDto } from '../comments/dto/update-comment.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import {
  CommentPaginationDto,
  RecipePaginationDto,
} from 'src/common/dto/pagination.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly commentsService: CommentsService,
  ) {}

  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created successfully' })
  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @GetUser() user: TokenPayload,
    @Body() createRecipeDto: CreateRecipeDto,
  ) {
    return this.recipesService.create(user.sub, createRecipeDto);
  }

  @ApiOperation({ summary: 'Find all recipes with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return list of recipes' })
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: RecipePaginationDto, @GetUser() user?: TokenPayload) {
    return this.recipesService.findAll({
      ...query,
      current_user_id: user?.sub,
    });
  }

  @ApiOperation({ summary: 'Get recipe by ID' })
  @ApiResponse({ status: 200, description: 'Return recipe detail' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @GetUser() user?: TokenPayload) {
    return this.recipesService.findOne(id, user?.sub);
  }

  @ApiOperation({ summary: 'Get recipes by user ID' })
  @ApiResponse({ status: 200, description: 'Return list of user recipes' })
  @Get('user/:id')
  getUserRecipes(@Param('id') user_id: string) {
    return this.recipesService.getUserRecipes(user_id);
  }

  @ApiOperation({ summary: 'Update a recipe' })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully' })
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: TokenPayload,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, user.sub, updateRecipeDto);
  }

  // Social Features
  @ApiOperation({ summary: 'Like or unlike a recipe' })
  @ApiResponse({ status: 200, description: 'Success message' })
  @ApiBearerAuth()
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likeRecipe(@GetUser() user: TokenPayload, @Param('id') recipe_id: string) {
    return this.recipesService.likeRecipe(user.sub, recipe_id);
  }

  @ApiOperation({ summary: 'Add a comment to a recipe' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @ApiBearerAuth()
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @GetUser() user: TokenPayload,
    @Param('id') recipe_id: string,
    @Body() dto: CreateCommentsDto,
  ) {
    return this.commentsService.create(user.sub, recipe_id, dto);
  }

  @ApiOperation({ summary: 'Get all comments of a recipe' })
  @ApiResponse({ status: 200, description: 'Return list of comments' })
  @Get(':id/comments')
  getAllCommentsOfRecipe(
    @Param('id') recipe_id: string,
    @Query() query: CommentPaginationDto,
  ) {
    return this.commentsService.findAllCommentsOfRecipe(recipe_id, query);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiBearerAuth()
  @Delete(':id/comments/:comment_id')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: TokenPayload,
  ) {
    return this.commentsService.deleteComment(id, user.sub);
  }

  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  @ApiBearerAuth()
  @Patch(':id/comments/:comment_id')
  @UseGuards(JwtAuthGuard)
  updateComment(
    @Param('comment_id', ParseIntPipe) id: number,
    @GetUser() user: TokenPayload,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, user.sub, dto);
  }
}
