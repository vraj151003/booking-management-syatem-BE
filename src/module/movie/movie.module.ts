import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieScheduler } from './movie.scheduler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports : [TypeOrmModule.forFeature([Movie]), ScheduleModule.forRoot()],
  providers: [MovieService, MovieScheduler],
  controllers: [MovieController],

})
export class MovieModule {}
