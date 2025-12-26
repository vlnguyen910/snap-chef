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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/common/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@GetUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }


  @Post(':id/follow')
  @UseGuards(AuthGuard('jwt'))
  followUser(
    @GetUser() user: User,
    @Param('id') following_id: string,
  ) {
    return this.usersService.followUser(user.id, following_id);
  }


}
