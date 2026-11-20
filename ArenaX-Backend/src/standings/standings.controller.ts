import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { StandingsService } from './standings.service';

@ApiTags('Standings')
@Controller()
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Public()
  @Get('tournaments/:id/standings')
  findByTournament(@Param('id', ParseIntPipe) id: number) {
    return this.standingsService.findByTournament(id);
  }
}
