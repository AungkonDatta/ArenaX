import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Standing } from './entities/standing.entity';
import { StandingsController } from './standings.controller';
import { StandingsService } from './standings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Standing,
      Tournament,
    ]),
  ],
  controllers: [StandingsController],
  providers: [StandingsService],
})
export class StandingsModule {}
