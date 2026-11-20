import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TournamentFormat } from '../enums/tournament-format.enum';

export class CreateTournamentDto {
  @IsInt()
  @Min(1)
  gameId: number;

  @IsString()
  @Length(3, 120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(TournamentFormat)
  format: TournamentFormat;

  @IsInt()
  @Min(2)
  @Max(64)
  maxTeams: number;

  @IsDateString()
  registrationDeadline: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  prizePool?: number;
}
