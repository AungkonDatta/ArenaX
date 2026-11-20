import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTournamentDto } from './create-tournament.dto';

export class UpdateTournamentDto extends PartialType(
  OmitType(CreateTournamentDto, ['gameId'] as const),
) {
}
