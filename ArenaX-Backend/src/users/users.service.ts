import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../common/services/hashing.service';
import { CreateStaffDto } from './dto/create-staff.dto';
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
}