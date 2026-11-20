import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchesService } from './matches.service';

@ApiTags('Matches')
@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Public()
  @Get('tournaments/:id/matches')
  findByTournament(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findByTournament(id);
  }

  @Public()
  @Get('matches/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Roles(Role.ORGANIZER)
  @Post('tournaments/:id/matches')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMatchDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchesService.create(id, dto, user);
  }
}
