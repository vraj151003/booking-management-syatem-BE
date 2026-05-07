import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie, MovieStatus } from './entity/movie.entity';
import { Cast } from './entity/cast.entity';
import { Crew, CrewRole } from './entity/crew.entity';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieFilterDto } from './dto/movie-filter.dto';
import * as xlsx from 'xlsx';

@Injectable()
export class MovieService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepo : Repository<Movie>,
        @InjectRepository(Cast)
        private readonly castRepo : Repository<Cast>,
        @InjectRepository(Crew)
        private readonly crewRepo : Repository<Crew>
    ){}

    async createMovie(dto: CreateMovieDto){
        // Ensure poster and trailer are arrays
        const movieData = {
            ...dto,
            poster: Array.isArray(dto.poster) ? dto.poster : dto.poster ? [dto.poster] : [],
            trailer: Array.isArray(dto.trailer) ? dto.trailer : dto.trailer ? [dto.trailer] : [],
            status: dto.status || MovieStatus.UPCOMING,
        };
        const { casts, crews, ...movieOnlyData } = movieData;
        const movie = this.movieRepo.create(movieOnlyData);
        const savedMovie = await this.movieRepo.save(movie);

        // Save casts if provided
        if (casts && casts.length > 0) {
            const castEntities = casts.map(cast => 
                this.castRepo.create({
                    ...cast,
                    movieId: savedMovie.id,
                })
            );
            await this.castRepo.save(castEntities);
        }

        // Save crews if provided
        if (crews && crews.length > 0) {
            const crewEntities = crews.map(crew => 
                this.crewRepo.create({
                    ...crew,
                    movieId: savedMovie.id,
                })
            );
            await this.crewRepo.save(crewEntities);
        }

        // Fetch movie with relations
        const movieWithRelations = await this.movieRepo.findOne({
            where: { id: savedMovie.id },
            relations: ['casts', 'crews']
        });

        return {
            message : "your movie created successfully",
            data : movieWithRelations
        }
    }
    
    async findAllMovies(filters?: MovieFilterDto){
        const queryBuilder = this.movieRepo
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.casts', 'casts')
            .leftJoinAndSelect('movie.crews', 'crews');

        // Apply search filter
        if (filters?.search) {
            queryBuilder.andWhere(
                '(LOWER(movie.name) LIKE LOWER(:search) OR LOWER(movie.description) LIKE LOWER(:search))',
                { search: `%${filters.search}%` }
            );
        }

        // Apply status filter
        if (filters?.status) {
            queryBuilder.andWhere('movie.status = :status', { status: filters.status });
        }

        // Apply genre filter
        if (filters?.genre) {
            queryBuilder.andWhere('movie.genre = :genre', { genre: filters.genre });
        }

        // Apply language filter
        if (filters?.language) {
            queryBuilder.andWhere('movie.language = :language', { language: filters.language });
        }

        // Apply rating filters
        if (filters?.minRating) {
            queryBuilder.andWhere('movie.rating >= :minRating', { minRating: filters.minRating });
        }

        if (filters?.maxRating) {
            queryBuilder.andWhere('movie.rating <= :maxRating', { maxRating: filters.maxRating });
        }

        // Apply date range filter
        if (filters?.startDate) {
            queryBuilder.andWhere('movie.releaseDate >= :startDate', { startDate: new Date(filters.startDate) });
        }

        if (filters?.endDate) {
            queryBuilder.andWhere('movie.releaseDate <= :endDate', { endDate: new Date(filters.endDate) });
        }

        // Apply active status filter
        if (filters?.isActive !== undefined) {
            queryBuilder.andWhere('movie.isActive = :isActive', { isActive: filters.isActive });
        }

        // Apply cast names filter
        if (filters?.castNames && filters.castNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM casts WHERE casts.movieId = movie.id AND casts.name IN (:...castNames))',
                { castNames: filters.castNames }
            );
        }

        // Apply crew names filter
        if (filters?.crewNames && filters.crewNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM crews WHERE crews.movieId = movie.id AND crews.name IN (:...crewNames))',
                { crewNames: filters.crewNames }
            );
        }

        return {
            message : "all movies fetched successfully",
            data : await queryBuilder.getMany()
        }
    }

    async findUpcomingMovies(filters?: MovieFilterDto){
        const queryBuilder = this.movieRepo
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.casts', 'casts')
            .leftJoinAndSelect('movie.crews', 'crews')
            .where('movie.status = :status', { status: MovieStatus.UPCOMING });

        // Apply search filter
        if (filters?.search) {
            queryBuilder.andWhere(
                '(LOWER(movie.name) LIKE LOWER(:search) OR LOWER(movie.description) LIKE LOWER(:search))',
                { search: `%${filters.search}%` }
            );
        }

        // Apply genre filter
        if (filters?.genre) {
            queryBuilder.andWhere('movie.genre = :genre', { genre: filters.genre });
        }

        // Apply language filter
        if (filters?.language) {
            queryBuilder.andWhere('movie.language = :language', { language: filters.language });
        }

        // Apply rating filters
        if (filters?.minRating) {
            queryBuilder.andWhere('movie.rating >= :minRating', { minRating: filters.minRating });
        }

        if (filters?.maxRating) {
            queryBuilder.andWhere('movie.rating <= :maxRating', { maxRating: filters.maxRating });
        }

        // Apply date range filter
        if (filters?.startDate) {
            queryBuilder.andWhere('movie.releaseDate >= :startDate', { startDate: new Date(filters.startDate) });
        }

        if (filters?.endDate) {
            queryBuilder.andWhere('movie.releaseDate <= :endDate', { endDate: new Date(filters.endDate) });
        }

        // Apply active status filter
        if (filters?.isActive !== undefined) {
            queryBuilder.andWhere('movie.isActive = :isActive', { isActive: filters.isActive });
        }

        // Apply cast names filter
        if (filters?.castNames && filters.castNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM casts WHERE casts.movieId = movie.id AND casts.name IN (:...castNames))',
                { castNames: filters.castNames }
            );
        }

        // Apply crew names filter
        if (filters?.crewNames && filters.crewNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM crews WHERE crews.movieId = movie.id AND crews.name IN (:...crewNames))',
                { crewNames: filters.crewNames }
            );
        }

        return {
            message : "upcoming movies fetched successfully",
            data : await queryBuilder.getMany()
        }
    }

    async findRunningMovies(filters?: MovieFilterDto){
        const queryBuilder = this.movieRepo
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.casts', 'casts')
            .leftJoinAndSelect('movie.crews', 'crews')
            .where('movie.status = :status', { status: MovieStatus.RUNNING });

        // Apply search filter
        if (filters?.search) {
            queryBuilder.andWhere(
                '(LOWER(movie.name) LIKE LOWER(:search) OR LOWER(movie.description) LIKE LOWER(:search))',
                { search: `%${filters.search}%` }
            );
        }

        // Apply genre filter
        if (filters?.genre) {
            queryBuilder.andWhere('movie.genre = :genre', { genre: filters.genre });
        }

        // Apply language filter
        if (filters?.language) {
            queryBuilder.andWhere('movie.language = :language', { language: filters.language });
        }

        // Apply rating filters
        if (filters?.minRating) {
            queryBuilder.andWhere('movie.rating >= :minRating', { minRating: filters.minRating });
        }

        if (filters?.maxRating) {
            queryBuilder.andWhere('movie.rating <= :maxRating', { maxRating: filters.maxRating });
        }

        // Apply date range filter
        if (filters?.startDate) {
            queryBuilder.andWhere('movie.releaseDate >= :startDate', { startDate: new Date(filters.startDate) });
        }

        if (filters?.endDate) {
            queryBuilder.andWhere('movie.releaseDate <= :endDate', { endDate: new Date(filters.endDate) });
        }

        // Apply active status filter
        if (filters?.isActive !== undefined) {
            queryBuilder.andWhere('movie.isActive = :isActive', { isActive: filters.isActive });
        }

        // Apply cast names filter
        if (filters?.castNames && filters.castNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM casts WHERE casts.movieId = movie.id AND casts.name IN (:...castNames))',
                { castNames: filters.castNames }
            );
        }

        // Apply crew names filter
        if (filters?.crewNames && filters.crewNames.length > 0) {
            queryBuilder.andWhere(
                'EXISTS (SELECT 1 FROM crews WHERE crews.movieId = movie.id AND crews.name IN (:...crewNames))',
                { crewNames: filters.crewNames }
            );
        }

        return {
            message : "running movies fetched successfully",
            data : await queryBuilder.getMany()
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
        const movie = await this.movieRepo.findOne({
            where : {id},
            relations: ['casts', 'crews']
        });

        if(!movie){
            throw new NotFoundException("Movie not found")
        }
        return {
            message : "movie fetched successfully",
            data : movie
        }
    }

    async updateMovie(id : string, dto : UpdateMovieDto){
        const movie = await this.movieRepo.findOne({
            where : {id},
            relations: ['casts', 'crews']
        });
        if(!movie){
            throw new NotFoundException("Movie Not Found");
        }

        const { casts, crews, ...movieOnlyData } = dto;
        Object.assign(movie, movieOnlyData);

        // Handle casts update
        if (casts !== undefined) {
            // Delete existing casts
            await this.castRepo.delete({ movieId: id });
            // Create new casts
            if (casts.length > 0) {
                const castEntities = casts.map(cast => 
                    this.castRepo.create({
                        ...cast,
                        movieId: id,
                    })
                );
                await this.castRepo.save(castEntities);
            }
        }

        // Handle crews update
        if (crews !== undefined) {
            // Delete existing crews
            await this.crewRepo.delete({ movieId: id });
            // Create new crews
            if (crews.length > 0) {
                const crewEntities = crews.map(crew => 
                    this.crewRepo.create({
                        ...crew,
                        movieId: id,
                    })
                );
                await this.crewRepo.save(crewEntities);
            }
        }

        await this.movieRepo.save(movie);

        // Fetch updated movie with relations
        const updatedMovie = await this.movieRepo.findOne({
            where: { id },
            relations: ['casts', 'crews']
        });

        return{
            message : "movie updated successfully",
            data : updatedMovie
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

                    // Handle casts if provided
                    if (row.casts && Array.isArray(row.casts)) {
                        const castEntities = row.casts.map((cast: any) => 
                            this.castRepo.create({
                                ...cast,
                                movieId: savedMovie.id,
                            })
                        );
                        await this.castRepo.save(castEntities);
                    }

                    // Handle crews if provided
                    if (row.crews && Array.isArray(row.crews)) {
                        const crewEntities = row.crews.map((crew: any) => 
                            this.crewRepo.create({
                                ...crew,
                                movieId: savedMovie.id,
                                role: crew.role || CrewRole.PRODUCER,
                            })
                        );
                        await this.crewRepo.save(crewEntities);
                    }

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
