import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { RegistrationReviewService } from './registration-review.service';

@ApiTags('Registration Review')
@Controller()
export class RegistrationReviewController {
  constructor(private readonly reviewService: RegistrationReviewService) {}

  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Get('tournaments/:id/registrations')
  findByTournament(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListRegistrationsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reviewService.findByTournament(id, query, user);
  }

  @Roles(Role.ORGANIZER)
  @Patch('registrations/:id')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reviewService.review(id, dto, user);
  }
}
