import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Game } from '../games/entities/game.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentStatus } from '../tournaments/enums/tournament-status.enum';
import { RegisterTeamDto } from './dto/register-team.dto';
import { TournamentRegistration } from './entities/tournament-registration.entity';
import { RegistrationStatus } from './enums/registration-status.enum';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  register(tournamentId: number, dto: RegisterTeamDto, user: AuthUser) {
    return this.dataSource.transaction(async (manager) => {
      const tournament = await manager.findOne(Tournament, {
        where: { id: tournamentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tournament) {
        throw new NotFoundException(`Tournament ${tournamentId} not found`);
      }
      if (tournament.status !== TournamentStatus.OPEN) {
        throw new ConflictException('This tournament is not open for registration');
      }
      if (new Date() > tournament.registrationDeadline) {
        throw new BadRequestException('The registration deadline has passed');
      }

      const team = await manager.findOne(Team, { where: { id: dto.teamId } });
      if (!team) {
        throw new NotFoundException(`Team ${dto.teamId} not found`);
      }
      if (team.captainId !== user.id) {
        throw new ForbiddenException('Only the team captain can register the team');
      }

      const game = await manager.findOne(Game, { where: { id: tournament.gameId } });
      const members = await manager.find(TeamMember, { where: { teamId: team.id } });
      if (members.length !== game.teamSize) {
        throw new BadRequestException(
          `${game.name} needs exactly ${game.teamSize} players, but this team has ${members.length}`,
        );
      }

      const alreadyRegistered = await manager.exists(TournamentRegistration, {
        where: { tournamentId, teamId: team.id },
      });
      if (alreadyRegistered) {
        throw new ConflictException('This team is already registered for the tournament');
      }

      const takenSlots = await manager.count(TournamentRegistration, {
        where: { tournamentId, status: Not(RegistrationStatus.REJECTED) },
      });
      if (takenSlots >= tournament.maxTeams) {
        throw new ConflictException('No free slot is left in this tournament');
      }

      const clash = await manager
        .createQueryBuilder(TeamMember, 'member')
        .innerJoin(TournamentRegistration, 'registration', 'registration.teamId = member.teamId')
        .where('registration.tournamentId = :tournamentId', { tournamentId })
        .andWhere('registration.status != :rejected', { rejected: RegistrationStatus.REJECTED })
        .andWhere('member.userId IN (:...userIds)', { userIds: members.map((m) => m.userId) })
        .getExists();
      if (clash) {
        throw new ConflictException('A player of this team is already in another team of this tournament');
      }

      const registration = manager.create(TournamentRegistration, {
        tournamentId,
        teamId: team.id,
      });
      return manager.save(registration);
    });
  }
}
