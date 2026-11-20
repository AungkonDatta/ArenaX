import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { paginate, skipTake } from '../common/utils/pagination';
import { MailService } from '../mail/mail.service';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { Tournament } from './entities/tournament.entity';
import { TournamentStatus } from './enums/tournament-status.enum';
import { assertCanManage } from './tournament-access';

@Injectable()
export class RegistrationReviewService {
  constructor(
    @InjectRepository(Tournament) private readonly tournamentsRepository: Repository<Tournament>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationsRepository: Repository<TournamentRegistration>,
    private readonly mailService: MailService,
  ) {}

  async findByTournament(tournamentId: number, query: ListRegistrationsQueryDto, user: AuthUser) {
    const tournament = await this.tournamentsRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    assertCanManage(tournament, user);

    const { skip, take } = skipTake(query);
    const [items, total] = await this.registrationsRepository.findAndCount({
      where: { tournamentId, ...(query.status ? { status: query.status } : {}) },
      relations: { team: true },
      order: { registeredAt: 'ASC' },
      skip,
      take,
    });
    return paginate(items, total, query);
  }

  async review(id: number, dto: ReviewRegistrationDto, user: AuthUser) {
    const registration = await this.registrationsRepository.findOne({
      where: { id },
      relations: { tournament: true, team: { captain: true } },
    });
    if (!registration) {
      throw new NotFoundException(`Registration ${id} not found`);
    }
    assertCanManage(registration.tournament, user, false);
    if (registration.tournament.status !== TournamentStatus.OPEN) {
      throw new ConflictException('Registrations can only be reviewed while the tournament is open');
    }

    registration.status = dto.status;
    if (dto.seed !== undefined) {
      registration.seed = dto.seed;
    }
    await this.registrationsRepository.save(registration);

    this.mailService.sendRegistrationDecision(
      registration.team.captain.email,
      registration.team.name,
      registration.tournament.title,
      registration.status,
    );

    return {
      id: registration.id,
      tournamentId: registration.tournamentId,
      team: { id: registration.team.id, name: registration.team.name, tag: registration.team.tag },
      status: registration.status,
      seed: registration.seed,
      registeredAt: registration.registeredAt,
    };
  }
}
