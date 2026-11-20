import { IsString, Length, Matches } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsString()
  @Length(2, 10)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'tag can contain only letters and numbers' })
  tag: string;
}
