import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Standing } from './entities/standing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Standing,
    ]),
  ],
})
export class StandingsModule {}
