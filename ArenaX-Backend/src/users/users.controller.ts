import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
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
}