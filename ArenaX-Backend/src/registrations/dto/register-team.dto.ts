import { IsInt, Min } from 'class-validator';

export class RegisterTeamDto {
  @IsInt()
  @Min(1)
  teamId: number;
}
