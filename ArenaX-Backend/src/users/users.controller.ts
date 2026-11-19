import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { Role } from './enums/role.enum';
import { UsersService } from './users.service';

@ApiTags('Users (Admin)')
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.changeRole(id, dto, user);
  }

  @Delete(':id')
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.deactivate(id, user);
  }
}