import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentRegistration } from './entities/tournament-registration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TournamentRegistration,
    ]),
  ],
})
export class RegistrationsModule {}
