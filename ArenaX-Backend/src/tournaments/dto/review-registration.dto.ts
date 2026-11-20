import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { RegistrationStatus } from '../../registrations/enums/registration-status.enum';

export class ReviewRegistrationDto {
  @IsIn([RegistrationStatus.APPROVED, RegistrationStatus.REJECTED])
  status: RegistrationStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  seed?: number;
}
