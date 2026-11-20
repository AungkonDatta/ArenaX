import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MailService } from '../mail/mail.service';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { RegistrationStatus } from '../registrations/enums/registration-status.enum';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentStatus } from '../tournaments/enums/tournament-status.enum';
import { assertCanManage } from '../tournaments/tournament-access';
import { CreateMatchDto } from './dto/create-match.dto';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
import { Match } from './entities/match.entity';
import { MatchStatus } from './enums/match-status.enum';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationsRepository: Repository<TournamentRegistration>,
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    private readonly mailService: MailService,
  ) {}

  async findByTournament(tournamentId: number) {
    await this.getTournament(tournamentId);
    return this.matchesRepository.find({
      where: { tournamentId },
      relations: { teamA: true, teamB: true, winner: true },
      order: { round: 'ASC', matchNo: 'ASC' },
    });
  }

  async findOne(id: number) {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { teamA: true, teamB: true, winner: true },
    });
    if (!match) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    return match;
  }

  async create(tournamentId: number, dto: CreateMatchDto, user: AuthUser) {
    const tournament = await this.getTournament(tournamentId);
    assertCanManage(tournament, user, false);
    if (tournament.status !== TournamentStatus.ONGOING) {
      throw new ConflictException('Matches can only be added to an ongoing tournament');
    }
    if (dto.teamAId && dto.teamAId === dto.teamBId) {
      throw new BadRequestException('A team cannot play against itself');
    }

    for (const teamId of [dto.teamAId, dto.teamBId].filter(Boolean)) {
      const approved = await this.registrationsRepository.exists({
        where: { tournamentId, teamId, status: RegistrationStatus.APPROVED },
      });
      if (!approved) {
        throw new BadRequestException(`Team ${teamId} is not approved for this tournament`);
      }
    }

    const match = this.matchesRepository.create({
      tournamentId,
      round: dto.round,
      matchNo: dto.matchNo,
      teamAId: dto.teamAId ?? null,
      teamBId: dto.teamBId ?? null,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      status: dto.scheduledAt ? MatchStatus.SCHEDULED : MatchStatus.PENDING,
    });
    const saved = await this.matchesRepository.save(match);
    return this.findOne(saved.id);
  }

  async schedule(id: number, dto: ScheduleMatchDto, user: AuthUser) {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { tournament: true },
    });
    if (!match) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    assertCanManage(match.tournament, user, false);
    if (match.status === MatchStatus.COMPLETED) {
      throw new ConflictException('A completed match cannot be rescheduled');
    }

    match.scheduledAt = new Date(dto.scheduledAt);
    match.status = MatchStatus.SCHEDULED;
    await this.matchesRepository.save(match);
    await this.notifySchedule(match);
    return this.findOne(id);
  }

  async remove(id: number, user: AuthUser) {
    const match = await this.matchesRepository.findOne({
      where: { id },
      relations: { tournament: true },
    });
    if (!match) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    assertCanManage(match.tournament, user, false);
    if (match.status === MatchStatus.COMPLETED || match.scoreA !== null) {
      throw new ConflictException('A match that already has a result cannot be deleted');
    }
    await this.matchesRepository.remove(match);
    return { message: `Match ${id} has been deleted` };
  }

  private async getTournament(id: number) {
    const tournament = await this.tournamentsRepository.findOne({ where: { id } });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${id} not found`);
    }
    return tournament;
  }

  private async notifySchedule(match: Match) {
    const teamIds = [match.teamAId, match.teamBId].filter(Boolean);
    if (teamIds.length === 0) {
      return;
    }
    const teams = await this.teamsRepository.find({
      where: { id: In(teamIds) },
      relations: { captain: true },
    });
    const teamA = teams.find((team) => team.id === match.teamAId);
    const teamB = teams.find((team) => team.id === match.teamBId);
    this.mailService.sendMatchScheduled(
      teams.map((team) => team.captain.email),
      match.tournament.title,
      teamA?.name ?? 'TBD',
      teamB?.name ?? 'TBD',
      match.scheduledAt,
    );
  }
}
