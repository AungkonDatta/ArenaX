import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [
    ProfileController,
    UsersController,
  ],
  providers: [
    UsersService,
    ProfileService,
  ],
})
export class UsersModule {}
