import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Matches(/^\d{2}-\d{5}-\d$/, { message: 'studentId must look like 23-51870-2' })
  studentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  inGameName?: string;
}
