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
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
  ) {}

  @Roles(Role.ORGANIZER)
  @Post()
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: AuthUser) {
    return this.tournamentsService.create(dto, user);
  }

  @Public()
  @Get()
  findAll(@Query() query: ListTournamentsQueryDto) {
    return this.tournamentsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tournamentsService.findOne(id);
  }

  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTournamentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tournamentsService.update(id, dto, user);
  }

  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.tournamentsService.remove(id, user);
  }
}
