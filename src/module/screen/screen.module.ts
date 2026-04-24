import { Module } from '@nestjs/common';
import { ScreenService } from './screen.service';
import { ScreenController } from './screen.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Screen } from './entity/screen.entity';
import { User } from '../users/entity/user.entity';
import { Seat } from '../seat/entity/seat.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Screen, User, Seat])],
  providers: [ScreenService],
  controllers: [ScreenController]
})
export class ScreenModule {}
