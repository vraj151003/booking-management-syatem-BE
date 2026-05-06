import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { Movie } from './entity/movie.entity';
import { Cast } from './entity/cast.entity';
import { Crew } from './entity/crew.entity';
import { AuditModule } from '../audit/audit.module';
import { MovieScheduler } from './movie.scheduler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports : [TypeOrmModule.forFeature([Movie, Cast, Crew]), ScheduleModule.forRoot(), AuditModule],
  providers: [MovieService, MovieScheduler],
  controllers: [MovieController],

})
export class MovieModule {}
