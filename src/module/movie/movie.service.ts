import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie, MovieStatus } from './entity/movie.entity';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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
            status: dto.status || MovieStatus.UPCOMING,
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

    async findUpcomingMovies(){
        return {
            message : "upcoming movies fetched successfully",
            data : await this.movieRepo.find({ where: { status: MovieStatus.UPCOMING } })
        }
    }

    async findRunningMovies(){
        return {
            message : "running movies fetched successfully",
            data : await this.movieRepo.find({ where: { status: MovieStatus.RUNNING } })
        }
    }

    async findTrendingMovies(){
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trendingMovies = await this.movieRepo
            .createQueryBuilder('movie')
            .leftJoin('movie.shows', 'show')
            .leftJoin('show.bookings', 'booking')
            .select([
                'movie.id',
                'movie.name',
                'movie.description',
                'movie.duration',
                'movie.genre',
                'movie.rating',
                'movie.language',
                'movie.releaseDate',
                'movie.poster',
                'movie.trailer',
                'movie.isActive',
                'movie.status',
                'movie.createdAt',
                'movie.updatedAt',
                'COUNT(booking.id) as bookingCount'
            ])
            .where('movie.status IN (:...statuses)', { statuses: [MovieStatus.RUNNING] })
            .andWhere('(booking.createdAt >= :thirtyDaysAgo OR booking.createdAt IS NULL)', { thirtyDaysAgo })
            .groupBy('movie.id')
            .orderBy('bookingCount', 'DESC')
            .addOrderBy('movie.rating', 'DESC')
            .limit(10)
            .getRawMany();

        // Map raw results back to Movie entities
        const movies = trendingMovies.map(row => ({
            id: row.movie_id,
            name: row.movie_name,
            description: row.movie_description,
            duration: row.movie_duration,
            genre: row.movie_genre,
            rating: row.movie_rating,
            language: row.movie_language,
            releaseDate: row.movie_releaseDate,
            poster: row.movie_poster,
            trailer: row.movie_trailer,
            isActive: row.movie_isActive,
            status: row.movie_status,
            createdAt: row.movie_createdAt,
            updatedAt: row.movie_updatedAt,
        }));

        return {
            message : "trending movies fetched successfully",
            data: movies
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

    async transitionMoviesToRunning(){
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingMovies = await this.movieRepo.find({
            where: {
                status: MovieStatus.UPCOMING,
                releaseDate: LessThanOrEqual(today),
            },
        });

        for (const movie of upcomingMovies) {
            movie.status = MovieStatus.RUNNING;
            await this.movieRepo.save(movie);
        }

        return {
            message: `${upcomingMovies.length} movies transitioned to running status`,
            count: upcomingMovies.length,
        };
    }

}
