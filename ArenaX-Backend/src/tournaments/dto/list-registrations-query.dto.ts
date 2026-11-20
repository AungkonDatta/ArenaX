import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RegistrationStatus } from '../../registrations/enums/registration-status.enum';

export class ListRegistrationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
