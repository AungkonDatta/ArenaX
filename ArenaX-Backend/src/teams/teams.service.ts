import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate, skipTake } from '../common/utils/pagination';
import { Role } from '../users/enums/role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamMember } from './entities/team-member.entity';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamMember) private readonly membersRepository: Repository<TeamMember>,
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
    query: PaginationQueryDto,
  ) {
    const qb = this.teamsRepository
      .createQueryBuilder('team')
      .loadRelationCountAndMap('team.memberCount', 'team.members')
      .orderBy('team.id', 'ASC');
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
    await this.teamsRepository.remove(team);
    return { message: `Team ${id} has been deleted` };
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
    return team;
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
}
