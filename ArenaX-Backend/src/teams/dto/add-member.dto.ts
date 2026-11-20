import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddMemberDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  inGameRole?: string;
}
