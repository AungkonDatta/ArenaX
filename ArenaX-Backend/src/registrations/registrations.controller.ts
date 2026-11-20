import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { RegisterTeamDto } from './dto/register-team.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@Roles(Role.PLAYER)
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('tournaments/:id/register')
  register(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterTeamDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.registrationsService.register(id, dto, user);
  }
}
