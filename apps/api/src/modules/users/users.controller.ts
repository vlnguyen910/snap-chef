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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayload } from 'src/common/interfaces';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user profile.',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users.',
  })
  findAll(@Query() query: UserPaginationDto, @GetUser() user?: TokenPayload) {
    return this.usersService.findAll(query, user?.sub);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user.',
  })
  getProfile(@GetUser() user: TokenPayload) {
    return this.usersService.getCurrentProfile(user.sub);
  }

  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get public profile',
    description: 'Retrieve the public profile of a specific user.',
  })
  getPublicProfile(
    @Param('id') target_id: string,
    @GetUser() user: TokenPayload | undefined,
  ) {
    return this.usersService.getPublicProfile(target_id, user?.sub);
  }

  @Get(':id/followers')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get user followers',
    description: 'Retrieve a paginated list of followers for a specific user.',
  })
  getFollowers(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload | undefined,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowers(profile_id, current_user?.sub, query);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user following',
    description:
      'Retrieve a paginated list of users that a specific user is following.',
  })
  getFollowing(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowing(profile_id, current_user.sub, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID.',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('me/likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get liked recipes',
    description:
      'Retrieve all recipes liked by the current authenticated user.',
  })
  getLikedRecipes(@GetUser() user: TokenPayload) {
    return this.usersService.getLikedRecipes(user.sub);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Follow user',
    description: 'Follow or unfollow a specific user.',
  })
  followUser(@GetUser() user: TokenPayload, @Param('id') following_id: string) {
    return this.usersService.followUser(user.sub, following_id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update the profile information of the current authenticated user.',
  })
  update(
    @Param('id') id: string,
    @GetUser() user: TokenPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.sub, updateUserDto);
  }
  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Block user',
    description: 'Block a specific user.',
  })
  blockUser(@GetUser() user: TokenPayload, @Param('id') target_id: string) {
    return this.usersService.blockUser(user.sub, target_id);
  }

  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unblock user',
    description: 'Unblock a specific user.',
  })
  unblockUser(@GetUser() user: TokenPayload, @Param('id') target_id: string) {
    return this.usersService.unblockUser(user.sub, target_id);
  }
}
