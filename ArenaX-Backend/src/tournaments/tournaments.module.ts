import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '../games/entities/game.entity';
import { Match } from '../matches/entities/match.entity';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { Tournament } from './entities/tournament.entity';
import { BracketService } from './bracket.service';
import { RegistrationReviewController } from './registration-review.controller';
import { RegistrationReviewService } from './registration-review.service';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      Game,
      TournamentRegistration,
      Match,
    ]),
  ],
  controllers: [
    TournamentsController,
    RegistrationReviewController,
  ],
  providers: [
    TournamentsService,
    RegistrationReviewService,
    BracketService,
  ],
})
export class TournamentsModule {}
