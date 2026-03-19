import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { UsersService, TopUserItem } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayload } from 'src/common/interfaces';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Find all users with pagination' })
  @ApiResponse({ status: 200, description: 'Return list of users' })
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: UserPaginationDto, @GetUser() user?: TokenPayload) {
    return this.usersService.findAll(query, user?.sub);
  }

  @ApiOperation({ summary: 'Get top users by follower count' })
  @ApiResponse({
    status: 200,
    description: 'Return top users with follower_count',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of users to return',
    example: 5,
  })
  @Get('top')
  getTopUsers(@Query('limit') limit?: string): Promise<TopUserItem[]> {
    return this.usersService.getTopUsers(limit ? Number(limit) : 5);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile' })
  @ApiBearerAuth()
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: TokenPayload) {
    return this.usersService.getCurrentProfile(user.sub);
  }

  @ApiOperation({ summary: 'Get current user likeds recipes' })
  @ApiResponse({ status: 200, description: 'Return list of liked recipes' })
  @ApiBearerAuth()
  @Get('me/likes')
  @UseGuards(JwtAuthGuard)
  getLikedRecipes(@GetUser() user: TokenPayload) {
    return this.usersService.getLikedRecipes(user.sub);
  }

  @ApiOperation({ summary: 'Get public profile of a user' })
  @ApiResponse({ status: 200, description: 'Return public profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicProfile(
    @Param('id') target_id: string,
    @GetUser() user: TokenPayload | undefined,
  ) {
    return this.usersService.getPublicProfile(target_id, user?.sub);
  }

  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiResponse({ status: 200, description: 'Return list of followers' })
  @Get(':id/followers')
  @UseGuards(OptionalJwtAuthGuard)
  getFollowers(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload | undefined,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowers(profile_id, current_user?.sub, query);
  }

  @ApiOperation({ summary: 'Get users followed by a user' })
  @ApiResponse({ status: 200, description: 'Return list of followed users' })
  @Get(':id/following')
  @UseGuards(OptionalJwtAuthGuard)
  getFollowing(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload | undefined,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowing(profile_id, current_user?.sub, query);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Return user data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Follow or unfollow a user' })
  @ApiResponse({ status: 200, description: 'Success message' })
  @ApiBearerAuth()
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  followUser(@GetUser() user: TokenPayload, @Param('id') following_id: string) {
    return this.usersService.followUser(user.sub, following_id);
  }

  @ApiOperation({ summary: 'Update user data' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiBearerAuth()
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: TokenPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.sub, updateUserDto);
  }

  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiBearerAuth()
  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  blockUser(@GetUser() user: TokenPayload, @Param('id') target_id: string) {
    return this.usersService.blockUser(user.sub, target_id);
  }

  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiBearerAuth()
  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  unblockUser(@GetUser() user: TokenPayload, @Param('id') target_id: string) {
    return this.usersService.unblockUser(user.sub, target_id);
  }
}
