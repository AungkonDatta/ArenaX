import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { paginate, skipTake } from '../common/utils/pagination';
import { TournamentRegistration } from '../registrations/entities/tournament-registration.entity';
import { RegistrationStatus } from '../registrations/enums/registration-status.enum';
import { TournamentStatus } from '../tournaments/enums/tournament-status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { ListTeamsQueryDto } from './dto/list-teams-query.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamMember } from './entities/team-member.entity';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamMember) private readonly membersRepository: Repository<TeamMember>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(TournamentRegistration)
    private readonly registrationsRepository: Repository<TournamentRegistration>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTeamDto, user: AuthUser) {
    const teamId = await this.dataSource.transaction(async (manager) => {
      const team = await manager.save(
        manager.create(Team, {
          name: dto.name,
          tag: dto.tag.toUpperCase(),
          captainId: user.id,
        }),
      );
      await manager.save(
        manager.create(TeamMember, {
          teamId: team.id,
          userId: user.id,
          inGameRole: 'Captain',
        }),
      );
      return team.id;
    });
    return this.getDetail(teamId);
  }

  async findAll(
    query: ListTeamsQueryDto,
  ) {
    const qb = this.teamsRepository
      .createQueryBuilder('team')
      .loadRelationCountAndMap('team.memberCount', 'team.members')
      .orderBy('team.id', 'ASC');
    if (query.search) {
      qb.where('(team.name ILIKE :search OR team.tag ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    const { skip, take } = skipTake(query);
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    return paginate(items, total, query);
  }

  findOne(id: number) {
    return this.getDetail(id);
  }

  async update(id: number, dto: UpdateTeamDto, user: AuthUser) {
    const team = await this.findTeam(id);
    this.assertCaptainOrAdmin(team, user);
    if (dto.name) {
      team.name = dto.name;
    }
    if (dto.tag) {
      team.tag = dto.tag.toUpperCase();
    }
    await this.teamsRepository.save(team);
    return this.getDetail(id);
  }

  async remove(id: number, user: AuthUser) {
    const team = await this.findTeam(id);
    this.assertCaptainOrAdmin(team, user);
    const inOngoingTournament = await this.registrationsRepository
      .createQueryBuilder('registration')
      .innerJoin('registration.tournament', 'tournament')
      .where('registration.teamId = :teamId', { teamId: id })
      .andWhere('registration.status = :approved', { approved: RegistrationStatus.APPROVED })
      .andWhere('tournament.status = :ongoing', { ongoing: TournamentStatus.ONGOING })
      .getExists();
    if (inOngoingTournament) {
      throw new ConflictException('This team cannot be deleted while it is playing in an ongoing tournament');
    }
    await this.teamsRepository.remove(team);
    return { message: `Team ${id} has been deleted` };
  }

  async addMember(teamId: number, dto: AddMemberDto, user: AuthUser) {
    const team = await this.findTeam(teamId);
    this.assertCaptain(team, user);

    const player = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!player || !player.isActive) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }
    if (player.role !== Role.PLAYER) {
      throw new BadRequestException('Only players can be added to a team');
    }
    const alreadyMember = await this.membersRepository.exists({
      where: { teamId, userId: dto.userId },
    });
    if (alreadyMember) {
      throw new ConflictException('This player is already in the team');
    }

    await this.membersRepository.save(
      this.membersRepository.create({
        teamId,
        userId: dto.userId,
        inGameRole: dto.inGameRole ?? null,
      }),
    );
    return this.getDetail(teamId);
  }

  async removeMember(teamId: number, userId: number, user: AuthUser) {
    const team = await this.findTeam(teamId);
    this.assertCaptain(team, user);
    if (userId === team.captainId) {
      throw new BadRequestException('The captain cannot be removed from the team');
    }

    const member = await this.membersRepository.findOne({ where: { teamId, userId } });
    if (!member) {
      throw new NotFoundException('This player is not a member of the team');
    }
    await this.membersRepository.remove(member);
    return this.getDetail(teamId);
  }

  private async getDetail(id: number) {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: { captain: true, members: { user: true } },
      order: { members: { joinedAt: 'ASC' } },
    });
    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    return {
      id: team.id,
      name: team.name,
      tag: team.tag,
      createdAt: team.createdAt,
      captain: {
        id: team.captain.id,
        name: team.captain.name,
        inGameName: team.captain.inGameName,
      },
      members: team.members.map((member) => ({
        userId: member.userId,
        name: member.user.name,
        inGameName: member.user.inGameName,
        inGameRole: member.inGameRole,
        joinedAt: member.joinedAt,
      })),
    };
  }

  private async findTeam(id: number) {
    const team = await this.teamsRepository.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    return team;
  }

  private assertCaptainOrAdmin(team: Team, user: AuthUser) {
    if (user.role !== Role.ADMIN && team.captainId !== user.id) {
      throw new ForbiddenException('Only the team captain or an admin can do this');
    }
  }

  private assertCaptain(team: Team, user: AuthUser) {
    if (team.captainId !== user.id) {
      throw new ForbiddenException('Only the team captain can manage the roster');
    }
  }
}
