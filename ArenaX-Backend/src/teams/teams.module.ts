import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from './entities/team-member.entity';
import { Team } from './entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Team,
      TeamMember,
    ]),
  ],
})
export class TeamsModule {}
