import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie, MovieStatus } from './entity/movie.entity';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import * as xlsx from 'xlsx';

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

    async bulkUploadMovies(file: Express.Multer.File) {
        try {
            const workbook = xlsx.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);

            if (!jsonData || jsonData.length === 0) {
                throw new BadRequestException('Excel file is empty or invalid');
            }

            const movies: Movie[] = [];
            const errors: { row: number; data: any; error: string }[] = [];

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i] as any;
                const rowNum = i + 2; // Excel row number (1-indexed + header)

                try {
                    // Validate required fields
                    if (!row.name || !row.description || !row.duration || !row.genre || 
                        !row.rating || !row.language || !row.releaseDate) {
                        throw new Error('Missing required fields');
                    }

                    const movieData = {
                        name: row.name,
                        description: row.description,
                        duration: Number(row.duration),
                        genre: row.genre,
                        rating: Number(row.rating),
                        language: row.language,
                        releaseDate: new Date(row.releaseDate),
                        poster: row.poster ? [row.poster] : [],
                        trailer: row.trailer ? [row.trailer] : [],
                        isActive: row.isActive !== undefined ? row.isActive : true,
                        status: row.status || MovieStatus.UPCOMING,
                    };

                    const movie = this.movieRepo.create(movieData);
                    const savedMovie = await this.movieRepo.save(movie);
                    movies.push(savedMovie);
                } catch (error) {
                    errors.push({
                        row: rowNum,
                        data: row,
                        error: error.message,
                    });
                }
            }

            return {
                message: `Bulk upload completed. ${movies.length} movies created successfully, ${errors.length} failed.`,
                successCount: movies.length,
                failureCount: errors.length,
                data: movies,
                errors: errors,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
        }
    }

    generateSampleExcelFile(): Buffer {
        const sampleData = [
            {
                name: 'Sample Movie 1',
                description: 'A sample movie description',
                duration: 120,
                genre: 'Action',
                rating: 8.5,
                language: 'English',
                releaseDate: '2024-05-01',
                poster: 'https://example.com/poster1.jpg',
                trailer: 'https://example.com/trailer1.mp4',
                isActive: true,
                status: 'UPCOMING',
            },
            {
                name: 'Sample Movie 2',
                description: 'Another sample movie',
                duration: 150,
                genre: 'Comedy',
                rating: 7.5,
                language: 'English',
                releaseDate: '2024-06-01',
                poster: 'https://example.com/poster2.jpg',
                trailer: 'https://example.com/trailer2.mp4',
                isActive: true,
                status: 'UPCOMING',
            },
        ];

        const worksheet = xlsx.utils.json_to_sheet(sampleData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Movies');
        return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

}
