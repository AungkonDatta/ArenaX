import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../games/entities/game.entity';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { Tournament } from './entities/tournament.entity';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      Game,
      TournamentRegistration,
    ]),
  ],
  controllers: [
    TournamentsController,
  ],
  providers: [
    TournamentsService,
  ],
})
export class TournamentsModule {}
