import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Movie])],
  providers: [MovieService],
  controllers: [MovieController],

})
export class MovieModule {}
