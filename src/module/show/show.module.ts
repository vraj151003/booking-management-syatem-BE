import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Show } from './entity/show.entity';
import { ShowService } from './show.service';
import { ShowController } from './show.controller';
import { Movie } from '../movie/entity/movie.entity';
import { Screen } from '../screen/entity/screen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Show, Movie, Screen])],
  providers: [ShowService],
  controllers: [ShowController],
})
export class ShowModule {}