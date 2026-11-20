import { OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { TournamentStatus } from '../enums/tournament-status.enum';
import { CreateTournamentDto } from './create-tournament.dto';

export class UpdateTournamentDto extends PartialType(
  OmitType(CreateTournamentDto, ['gameId'] as const),
) {
  @IsOptional()
  @IsIn([TournamentStatus.DRAFT, TournamentStatus.OPEN])
  status?: TournamentStatus;
}
