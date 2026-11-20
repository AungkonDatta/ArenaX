import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../users/enums/role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Roles(Role.PLAYER)
  @Post()
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: AuthUser) {
    return this.teamsService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }
}
