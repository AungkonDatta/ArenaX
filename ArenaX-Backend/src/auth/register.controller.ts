import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { RegisterService } from './register.service';

@ApiTags('Auth')
@Controller('auth')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.registerService.register(dto);
  }
}