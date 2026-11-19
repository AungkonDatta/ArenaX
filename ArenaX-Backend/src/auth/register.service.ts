import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../common/services/hashing.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.usersRepository.exists({ where: { email } });
    if (exists) {
      throw new ConflictException('This email is already registered');
    }

    const user = this.usersRepository.create({
      name: dto.name,
      email,
      passwordHash: await this.hashingService.hash(dto.password),
      role: Role.PLAYER,
      studentId: dto.studentId ?? null,
      inGameName: dto.inGameName ?? null,
    });
    const saved = await this.usersRepository.save(user);
    const { passwordHash, ...profile } = saved;
    return profile;
  }
}