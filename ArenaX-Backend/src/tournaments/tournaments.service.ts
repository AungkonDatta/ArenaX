import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { paginate, skipTake } from '../common/utils/pagination';
import { Game } from '../games/entities/game.entity';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { RegistrationStatus } from '../registrations/enums/registration-status.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentStatus } from './enums/tournament-status.enum';
import { assertCanManage } from './tournament-access';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Game) private readonly gamesRepository: Repository<Game>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationsRepository: Repository<TournamentRegistration>,
  ) {}

  async create(dto: CreateTournamentDto, user: AuthUser) {
    const game = await this.gamesRepository.findOne({ where: { id: dto.gameId } });
    if (!game) {
      throw new NotFoundException(`Game ${dto.gameId} not found`);
    }
    const deadline = new Date(dto.registrationDeadline);
    if (deadline <= new Date()) {
      throw new BadRequestException('registrationDeadline must be in the future');
    }
    if (dto.startDate && new Date(dto.startDate) < deadline) {
      throw new BadRequestException('startDate must be after the registration deadline');
    }

    const tournament = this.tournamentsRepository.create({
      ...dto,
      registrationDeadline: deadline,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      organizerId: user.id,
      status: TournamentStatus.DRAFT,
    });
    const saved = await this.tournamentsRepository.save(tournament);
    return this.findOne(saved.id);
  }

  async findAll(query: ListTournamentsQueryDto) {
    const qb = this.tournamentsRepository
      .createQueryBuilder('tournament')
      .leftJoinAndSelect('tournament.game', 'game')
      .orderBy('tournament.createdAt', 'DESC');

    if (query.gameId) {
      qb.andWhere('tournament.gameId = :gameId', { gameId: query.gameId });
    }
    if (query.status) {
      qb.andWhere('tournament.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('tournament.title ILIKE :search', { search: `%${query.search}%` });
    }

    const { skip, take } = skipTake(query);
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const tournament = await this.tournamentsRepository.findOne({
      where: { id },
      relations: { game: true },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${id} not found`);
    }
    return tournament;
  }

  async update(id: number, dto: UpdateTournamentDto, user: AuthUser) {
    const tournament = await this.findOne(id);
    assertCanManage(tournament, user);
    this.assertEditable(tournament);

    const takenSlots = await this.registrationsRepository.count({
      where: { tournamentId: id, status: Not(RegistrationStatus.REJECTED) },
    });
    if (dto.maxTeams !== undefined && dto.maxTeams < takenSlots) {
      throw new BadRequestException(`maxTeams cannot be less than ${takenSlots} registered teams`);
    }

    const deadline = dto.registrationDeadline
      ? new Date(dto.registrationDeadline)
      : tournament.registrationDeadline;
    if (dto.status === TournamentStatus.OPEN && deadline <= new Date()) {
      throw new BadRequestException('Set a future registration deadline before opening registration');
    }
    if (dto.status === TournamentStatus.DRAFT && tournament.status === TournamentStatus.OPEN && takenSlots > 0) {
      throw new ConflictException('Teams have already registered, so the tournament cannot go back to draft');
    }

    Object.assign(tournament, {
      ...dto,
      registrationDeadline: dto.registrationDeadline
        ? new Date(dto.registrationDeadline)
        : tournament.registrationDeadline,
      startDate: dto.startDate ? new Date(dto.startDate) : tournament.startDate,
    });
    await this.tournamentsRepository.save(tournament);
    return this.findOne(id);
  }

  async remove(id: number, user: AuthUser) {
    const tournament = await this.findOne(id);
    assertCanManage(tournament, user);
    if (
      tournament.status === TournamentStatus.ONGOING ||
      tournament.status === TournamentStatus.COMPLETED
    ) {
      throw new ConflictException('A tournament cannot be deleted after its bracket is generated');
    }
    await this.tournamentsRepository.remove(tournament);
    return { message: `Tournament ${id} has been deleted` };
  }

  private assertEditable(tournament: Tournament) {
    if (
      tournament.status === TournamentStatus.ONGOING ||
      tournament.status === TournamentStatus.COMPLETED
    ) {
      throw new ConflictException('This tournament can no longer be edited');
    }
  }
}
