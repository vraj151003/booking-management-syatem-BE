import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepo : Repository<Movie>
    ){}

    async createMovie(dto: CreateMovieDto){
        // Ensure poster and trailer are arrays
        const movieData = {
            ...dto,
            poster: Array.isArray(dto.poster) ? dto.poster : dto.poster ? [dto.poster] : [],
            trailer: Array.isArray(dto.trailer) ? dto.trailer : dto.trailer ? [dto.trailer] : [],
        };
        const movie = this.movieRepo.create(movieData);
        return {
            message : "your movie created successfully",
            data : await this.movieRepo.save(movie)
        }
    }
    
    async findAllMovies(){
        return {
            message : "all movies fetched successfully",
            data : await this.movieRepo.find()
        }
    }

    async findOneMovie(id: string){
        const movie = await this.movieRepo.findOne({where : {id}});

        if(!movie){
            throw new NotFoundException("Movie not found")
        }
        return {
            message : "movie fetched successfully",
            data : movie
        }
    }

    async updateMovie(id : string, dto : UpdateMovieDto){
        const movie = await this.movieRepo.findOne({where : {id}});
        if(!movie){
            throw new NotFoundException("Movie Not Found");
        } 
        Object.assign(movie, dto);

        return{
            message : "movie updated successfully",
            data : await this.movieRepo.save(movie)
        }
    }

    async deleteMovie(id : string){
        const movie = await this.movieRepo.findOne({where : {id}});
        if(!movie){
            throw new NotFoundException("Movie Not Found");
        }
        await this.movieRepo.remove(movie);
        return {
            message : "movie deleted successfully"
        }
    }

}
