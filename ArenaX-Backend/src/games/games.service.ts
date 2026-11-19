import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate, skipTake } from '../common/utils/pagination';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';

@Injectable()
export class GamesService {
  constructor(@InjectRepository(Game) private readonly gamesRepository: Repository<Game>) {}

  async create(dto: CreateGameDto) {
    const exists = await this.gamesRepository
      .createQueryBuilder('game')
      .where('LOWER(game.name) = LOWER(:name)', { name: dto.name })
      .getExists();
    if (exists) {
      throw new ConflictException('A game with this name already exists');
    }
    return this.gamesRepository.save(this.gamesRepository.create(dto));
  }

  async findAll(query: PaginationQueryDto) {
    const { skip, take } = skipTake(query);
    const [items, total] = await this.gamesRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take,
    });
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const game = await this.gamesRepository.findOne({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game ${id} not found`);
    }
    return game;
  }

  async update(id: number, dto: UpdateGameDto) {
    const game = await this.findOne(id);
    Object.assign(game, dto);
    return this.gamesRepository.save(game);
  }

  async remove(id: number) {
    const game = await this.findOne(id);
    await this.gamesRepository.remove(game);
    return { message: `Game ${id} has been deleted` };
  }
}
