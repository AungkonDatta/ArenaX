import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, skipTake } from '../common/utils/pagination';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepository: Repository<AuditLog>) {}

  async findAll(query: ListAuditLogsQueryDto) {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.role'])
      .orderBy('log.createdAt', 'DESC')
      .addOrderBy('log.id', 'DESC');

    if (query.userId) {
      qb.andWhere('log.userId = :userId', { userId: query.userId });
    }
    if (query.entity) {
      qb.andWhere('log.entity = :entity', { entity: query.entity });
    }
    if (query.from) {
      qb.andWhere('log.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('log.createdAt <= :to', { to: query.to });
    }

    const { skip, take } = skipTake(query);
    const [items, total] = await qb.skip(skip).take(take).getManyAndCount();
    return paginate(items, total, query);
  }
}
