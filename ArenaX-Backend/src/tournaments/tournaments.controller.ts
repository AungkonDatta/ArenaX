import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
}
