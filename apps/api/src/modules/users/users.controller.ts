import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayload } from 'src/common/interfaces';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: UserPaginationDto, @GetUser() user?: TokenPayload) {
    return this.usersService.findAll(query, user?.sub);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: TokenPayload) {
    return this.usersService.getCurrentProfile(user.sub);
  }

  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  getPublicProfile(
    @Param('id') target_id: string,
    @GetUser() user: TokenPayload | undefined,
  ) {
    return this.usersService.getPublicProfile(target_id, user?.sub);
  }

  @Get(':id/followers')
  @UseGuards(OptionalJwtAuthGuard)
  getFollowers(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload | undefined,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowers(profile_id, current_user?.sub, query);
  }

  @Get(':id/following')
  @UseGuards(JwtAuthGuard)
  getFollowing(
    @Param('id') profile_id: string,
    @GetUser() current_user: TokenPayload | undefined,
    @Query() query: UserPaginationDto,
  ) {
    return this.usersService.getFollowing(profile_id, current_user?.sub, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('me/likes')
  @UseGuards(JwtAuthGuard)
  getLikedRecipes(@GetUser() user: TokenPayload) {
    return this.usersService.getLikedRecipes(user.sub);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  followUser(@GetUser() user: TokenPayload, @Param('id') following_id: string) {
    return this.usersService.followUser(user.sub, following_id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @GetUser() user: TokenPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, user.sub, updateUserDto);
  }
}
