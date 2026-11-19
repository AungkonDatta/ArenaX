import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, skipTake } from '../common/utils/pagination';
import { HashingService } from '../common/services/hashing.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async createStaff(dto: CreateStaffDto) {
    const email = dto.email.toLowerCase();
    if (await this.usersRepository.exists({ where: { email } })) {
      throw new ConflictException('This email is already registered');
    }
    const user = this.usersRepository.create({
      name: dto.name,
      email,
      passwordHash: await this.hashingService.hash(dto.password),
      role: dto.role,
      studentId: dto.studentId ?? null,
      inGameName: dto.inGameName ?? null,
    });
    const saved = await this.usersRepository.save(user);
    const { passwordHash, ...profile } = saved;
    return profile;
  }

  async findAll(query: ListUsersQueryDto) {
    const qb = this.usersRepository.createQueryBuilder('user').orderBy('user.id', 'ASC');
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query.search) {
      qb.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    const { skip, take } = skipTake(query);
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async changeRole(id: number, dto: ChangeRoleDto, currentUser: AuthUser) {
    if (id === currentUser.id) {
      throw new BadRequestException('You cannot change your own role');
    }
    const user = await this.findOne(id);
    user.role = dto.role;
    return this.usersRepository.save(user);
  }
}