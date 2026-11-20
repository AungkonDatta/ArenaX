import { IsDateString } from 'class-validator';

export class ScheduleMatchDto {
  @IsDateString()
  scheduledAt: string;
}
