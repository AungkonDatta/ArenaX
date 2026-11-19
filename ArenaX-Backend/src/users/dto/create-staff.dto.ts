import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class CreateStaffDto {
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

  @IsIn([Role.ORGANIZER, Role.ADMIN])
  role: Role;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  studentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  inGameName?: string;
}