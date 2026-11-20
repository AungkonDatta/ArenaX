import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { paginate, skipTake } from '../common/utils/pagination';
import { Game } from '../games/entities/game.entity';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentStatus } from './enums/tournament-status.enum';

@Injectable()
export class TournamentsService {
  constructor(
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(Game) private readonly gamesRepository: Repository<Game>,
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
}
