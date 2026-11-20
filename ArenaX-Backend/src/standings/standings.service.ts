import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Standing } from './entities/standing.entity';

@Injectable()
export class StandingsService {
  constructor(
    @InjectRepository(Standing) private readonly standingsRepository: Repository<Standing>,
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
  ) {}

  async findByTournament(tournamentId: number) {
    const tournament = await this.tournamentsRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }

    const standings = await this.standingsRepository.find({
      where: { tournamentId },
      relations: { team: true },
      order: { points: 'DESC', wins: 'DESC', draws: 'DESC', losses: 'ASC' },
    });

    return {
      tournament: {
        id: tournament.id,
        title: tournament.title,
        format: tournament.format,
        status: tournament.status,
      },
      table: standings.map((standing, index) => ({
        rank: index + 1,
        team: { id: standing.team.id, name: standing.team.name, tag: standing.team.tag },
        played: standing.played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        points: standing.points,
      })),
    };
  }
}
