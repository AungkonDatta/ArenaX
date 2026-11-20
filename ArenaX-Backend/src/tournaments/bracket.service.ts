import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Match } from '../matches/entities/match.entity';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { RegistrationStatus } from '../registrations/enums/registration-status.enum';
import { Tournament } from './entities/tournament.entity';
import { TournamentStatus } from './enums/tournament-status.enum';
import { assertCanManage } from './tournament-access';

@Injectable()
export class BracketService {
  constructor(private readonly dataSource: DataSource) {}

  generate(tournamentId: number, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const tournament = await manager.findOne(Tournament, {
        where: { id: tournamentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tournament) {
        throw new NotFoundException(`Tournament ${tournamentId} not found`);
      }
      assertCanManage(tournament, user, false);
      if (tournament.status !== TournamentStatus.OPEN) {
        throw new ConflictException('The bracket can only be generated while the tournament is open');
      }

      const approved = await manager.find(TournamentRegistration, {
        where: { tournamentId, status: RegistrationStatus.APPROVED },
        order: { seed: { direction: 'ASC', nulls: 'LAST' }, registeredAt: 'ASC' },
      });
      if (approved.length < 2) {
        throw new BadRequestException('At least two approved teams are needed to generate a bracket');
      }
      const teamIds = approved.map((registration) => registration.teamId);

      await this.createSingleElimination(manager, tournament, teamIds);

      tournament.status = TournamentStatus.ONGOING;
      await manager.save(tournament);

      return manager.find(Match, {
        where: { tournamentId },
        order: { round: 'ASC', matchNo: 'ASC' },
      });
    });
  }

  private async createSingleElimination(
    manager: EntityManager,
    tournament: Tournament,
    teamIds: number[],
  ) {
    let size = 2;
    while (size < teamIds.length) {
      size *= 2;
    }
    const totalRounds = Math.log2(size);
    const positions = this.seedPositions(size);
    const rounds: Match[][] = [];

    for (let round = totalRounds; round >= 1; round--) {
      const matchCount = size / 2 ** round;
      const roundMatches: Match[] = [];

      for (let matchNo = 1; matchNo <= matchCount; matchNo++) {
        const match = manager.create(Match, { tournamentId: tournament.id, round, matchNo });
        if (round < totalRounds) {
          const nextMatch = rounds[round + 1][Math.ceil(matchNo / 2) - 1];
          match.nextMatchId = nextMatch.id;
          match.nextSlot = matchNo % 2 === 1 ? 'A' : 'B';
        }
        if (round === 1) {
          const seedA = positions[(matchNo - 1) * 2];
          const seedB = positions[(matchNo - 1) * 2 + 1];
          match.teamAId = teamIds[seedA - 1] ?? null;
          match.teamBId = teamIds[seedB - 1] ?? null;
        }
        roundMatches.push(await manager.save(match));
      }
      rounds[round] = roundMatches;
    }

    for (const match of rounds[1]) {
      if (match.teamAId && match.teamBId) {
        continue;
      }
      match.winnerId = match.teamAId ?? match.teamBId;
      match.status = MatchStatus.COMPLETED;
      await manager.save(match);

      const nextMatch = rounds[2]?.find((candidate) => candidate.id === match.nextMatchId);
      if (nextMatch) {
        if (match.nextSlot === 'A') {
          nextMatch.teamAId = match.winnerId;
        } else {
          nextMatch.teamBId = match.winnerId;
        }
        await manager.save(nextMatch);
      }
    }
  }

  private seedPositions(size: number): number[] {
    let positions = [1];
    while (positions.length < size) {
      const total = positions.length * 2 + 1;
      positions = positions.flatMap((seed) => [seed, total - seed]);
    }
    return positions;
  }
}
