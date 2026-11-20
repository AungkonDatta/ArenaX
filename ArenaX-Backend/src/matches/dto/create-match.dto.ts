import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  @Min(1)
  round: number;

  @IsInt()
  @Min(1)
  matchNo: number;

  @IsOptional()
  @IsInt()
  teamAId?: number;

  @IsOptional()
  @IsInt()
  teamBId?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
