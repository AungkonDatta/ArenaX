import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '../users/enums/role.enum';
import { Tournament } from './entities/tournament.entity';

export function assertCanManage(tournament: Tournament, user: AuthUser, allowAdmin = true) {
  if (allowAdmin && user.role === Role.ADMIN) {
    return;
  }
  if (tournament.organizerId !== user.id) {
    throw new ForbiddenException('You can only manage your own tournaments');
  }
}
