import { IsInt, Max, Min } from 'class-validator';

export class SubmitResultDto {
  @IsInt()
  @Min(0)
  @Max(999)
  scoreA: number;

  @IsInt()
  @Min(0)
  @Max(999)
  scoreB: number;
}
