import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;

  @IsOptional()
  @Matches(/^\d{2}-\d{5}-\d$/, { message: 'studentId must look like 23-51870-2' })
  studentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  inGameName?: string;
}