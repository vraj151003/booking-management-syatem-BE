import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovieService } from './movie.service';
import { Movie, MovieStatus } from './entity/movie.entity';
import { Cast } from './entity/cast.entity';
import { Crew } from './entity/crew.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieService', () => {
  let service: MovieService;
  let movieRepo: Repository<Movie>;

  const mockMovie: Movie = {
    id: 'movie-1',
    name: 'Test Movie',
    description: 'Test Description',
    duration: 120,
    genre: 'Action',
    rating: 8.5,
    language: 'English',
    releaseDate: new Date(),
    poster: ['url1.jpg'],
    trailer: ['url1.mp4'],
    isActive: true,
    status: MovieStatus.UPCOMING,
    createdAt: new Date(),
    updatedAt: new Date(),
    shows: [],
    casts: [],
    crews: [],
  };

  const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue([]),
  getMany: jest.fn().mockResolvedValue([mockMovie]),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
};

const mockMovieRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

  beforeEach(async () => {
    mockMovieRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepo,
        },
        {
          provide: getRepositoryToken(Cast),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Crew),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    movieRepo = module.get<Repository<Movie>>(getRepositoryToken(Movie));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMovie', () => {
    describe('Success cases', () => {
      it('should create a movie successfully', async () => {
        // Arrange
        const dto: CreateMovieDto = {
          name: 'Test Movie',
          description: 'Test Description',
          duration: 120,
          genre: 'Action',
          rating: 8.5,
          language: 'English',
          releaseDate: new Date(),
        };
        mockMovieRepo.create.mockReturnValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);

        // Act
        const result = await service.createMovie(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(movieRepo.create).toHaveBeenCalled();
        expect(movieRepo.save).toHaveBeenCalledWith(mockMovie);
        expect(movieRepo.findOne).toHaveBeenCalledWith({
          where: { id: mockMovie.id },
          relations: ['casts', 'crews']
        });
      });

      it('should handle poster and trailer arrays', async () => {
        // Arrange
        const dto: CreateMovieDto = {
          name: 'Test Movie',
          description: 'Test Description',
          duration: 120,
          genre: 'Action',
          rating: 8.5,
          language: 'English',
          releaseDate: new Date(),
          poster: ['url1.jpg', 'url2.jpg'],
          trailer: ['url1.mp4'],
        };
        mockMovieRepo.create.mockReturnValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);

        // Act
        const result = await service.createMovie(dto);

        // Assert
        expect(movieRepo.create).toHaveBeenCalledWith({
          ...dto,
          poster: ['url1.jpg', 'url2.jpg'],
          trailer: ['url1.mp4'],
          status: MovieStatus.UPCOMING,
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle null poster and trailer', async () => {
        // Arrange
        const dto: CreateMovieDto = {
          name: 'Test Movie',
          description: 'Test Description',
          duration: 120,
          genre: 'Action',
          rating: 8.5,
          language: 'English',
          releaseDate: new Date(),
          poster: undefined,
          trailer: undefined,
        };
        mockMovieRepo.create.mockReturnValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);

        // Act
        const result = await service.createMovie(dto);

        // Assert
        expect(movieRepo.create).toHaveBeenCalledWith({
          ...dto,
          poster: [],
          trailer: [],
          status: MovieStatus.UPCOMING,
        });
      });

      it('should handle undefined poster and trailer', async () => {
        // Arrange
        const dto: CreateMovieDto = {
          name: 'Test Movie',
          description: 'Test Description',
          duration: 120,
          genre: 'Action',
          rating: 8.5,
          language: 'English',
          releaseDate: new Date(),
        };
        mockMovieRepo.create.mockReturnValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);

        // Act
        const result = await service.createMovie(dto);

        // Assert
        expect(movieRepo.create).toHaveBeenCalledWith({
          ...dto,
          poster: [],
          trailer: [],
          status: MovieStatus.UPCOMING,
        });
      });
    });
  });

  describe('findAllMovies', () => {
    describe('Success cases', () => {
      it('should return all movies', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([mockMovie]);

        // Act
        const result = await service.findAllMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.casts', 'casts');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.crews', 'crews');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });

      it('should return empty array when no movies exist', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.findAllMovies();

        // Assert
        expect(result.data).toEqual([]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAllMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findUpcomingMovies', () => {
    describe('Success cases', () => {
      it('should return all upcoming movies', async () => {
        // Arrange
        const upcomingMovie = { ...mockMovie, status: MovieStatus.UPCOMING };
        mockQueryBuilder.getMany.mockResolvedValue([upcomingMovie]);

        // Act
        const result = await service.findUpcomingMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([upcomingMovie]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.casts', 'casts');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.crews', 'crews');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('movie.status = :status', { status: MovieStatus.UPCOMING });
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });

      it('should return empty array when no upcoming movies exist', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.findUpcomingMovies();

        // Assert
        expect(result.data).toEqual([]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findUpcomingMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findRunningMovies', () => {
    describe('Success cases', () => {
      it('should return all running movies', async () => {
        // Arrange
        const runningMovie = { ...mockMovie, status: MovieStatus.RUNNING };
        mockQueryBuilder.getMany.mockResolvedValue([runningMovie]);

        // Act
        const result = await service.findRunningMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([runningMovie]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.casts', 'casts');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('movie.crews', 'crews');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('movie.status = :status', { status: MovieStatus.RUNNING });
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });

      it('should return empty array when no running movies exist', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.findRunningMovies();

        // Assert
        expect(result.data).toEqual([]);
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findRunningMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findTrendingMovies', () => {
    describe('Success cases', () => {
      it('should return top 10 trending movies ordered by booking count', async () => {
        // Arrange
        const rawResults = [
          {
            movie_id: 'movie-1',
            movie_name: 'Test Movie 1',
            movie_description: 'Description 1',
            movie_duration: 120,
            movie_genre: 'Action',
            movie_rating: 8.5,
            movie_language: 'English',
            movie_releaseDate: new Date(),
            movie_poster: ['url1.jpg'],
            movie_trailer: ['url1.mp4'],
            movie_isActive: true,
            movie_status: MovieStatus.RUNNING,
            movie_createdAt: new Date(),
            movie_updatedAt: new Date(),
            bookingCount: '100',
          },
          {
            movie_id: 'movie-2',
            movie_name: 'Test Movie 2',
            movie_description: 'Description 2',
            movie_duration: 120,
            movie_genre: 'Comedy',
            movie_rating: 7.5,
            movie_language: 'English',
            movie_releaseDate: new Date(),
            movie_poster: ['url2.jpg'],
            movie_trailer: ['url2.mp4'],
            movie_isActive: true,
            movie_status: MovieStatus.RUNNING,
            movie_createdAt: new Date(),
            movie_updatedAt: new Date(),
            bookingCount: '50',
          },
        ];
        mockQueryBuilder.getRawMany.mockResolvedValue(rawResults);

        // Act
        const result = await service.findTrendingMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('movie-1');
        expect(result.data[1].id).toBe('movie-2');
        expect(mockMovieRepo.createQueryBuilder).toHaveBeenCalledWith('movie');
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('movie.shows', 'show');
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('show.bookings', 'booking');
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'movie.status IN (:...statuses)',
          { statuses: [MovieStatus.RUNNING] }
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          '(booking.createdAt >= :thirtyDaysAgo OR booking.createdAt IS NULL)',
          expect.objectContaining({ thirtyDaysAgo: expect.any(Date) })
        );
        expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('movie.id');
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('bookingCount', 'DESC');
        expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('movie.rating', 'DESC');
        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      });

      it('should return empty array when no trending movies exist', async () => {
        // Arrange
        mockQueryBuilder.getRawMany.mockResolvedValue([]);

        // Act
        const result = await service.findTrendingMovies();

        // Assert
        expect(result.data).toEqual([]);
        expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
      });

      it('should limit results to 10 movies', async () => {
        // Arrange
        const manyResults = Array.from({ length: 15 }, (_, i) => ({
          movie_id: `movie-${i}`,
          movie_name: `Movie ${i}`,
          movie_description: `Description ${i}`,
          movie_duration: 120,
          movie_genre: 'Action',
          movie_rating: 8.5,
          movie_language: 'English',
          movie_releaseDate: new Date(),
          movie_poster: [`url${i}.jpg`],
          movie_trailer: [`url${i}.mp4`],
          movie_isActive: true,
          movie_status: MovieStatus.RUNNING,
          movie_createdAt: new Date(),
          movie_updatedAt: new Date(),
          bookingCount: (100 - i * 5).toString(),
        }));
        mockQueryBuilder.getRawMany.mockResolvedValue(manyResults.slice(0, 10));

        // Act
        const result = await service.findTrendingMovies();

        // Assert
        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors', async () => {
        // Arrange
        mockQueryBuilder.getRawMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findTrendingMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('transitionMoviesToRunning', () => {
    describe('Success cases', () => {
      it('should transition movies to running status when release date is reached', async () => {
        // Arrange
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - 1);

        const upcomingMovie = { ...mockMovie, status: MovieStatus.UPCOMING, releaseDate: pastDate };
        mockMovieRepo.find.mockResolvedValue([upcomingMovie]);
        mockMovieRepo.save.mockResolvedValue({ ...upcomingMovie, status: MovieStatus.RUNNING });

        // Act
        const result = await service.transitionMoviesToRunning();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('count');
        expect(result.count).toBe(1);
        expect(movieRepo.find).toHaveBeenCalledWith({
          where: {
            status: MovieStatus.UPCOMING,
            releaseDate: expect.any(Object),
          },
        });
        expect(movieRepo.save).toHaveBeenCalled();
      });

      it('should not transition movies with future release dates', async () => {
        // Arrange
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + 1);

        const upcomingMovie = { ...mockMovie, status: MovieStatus.UPCOMING, releaseDate: futureDate };
        mockMovieRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.transitionMoviesToRunning();

        // Assert
        expect(result.count).toBe(0);
        expect(movieRepo.save).not.toHaveBeenCalled();
      });

      it('should handle multiple movies transitioning', async () => {
        // Arrange
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - 1);

        const upcomingMovies = [
          { ...mockMovie, id: 'movie-1', status: MovieStatus.UPCOMING, releaseDate: pastDate },
          { ...mockMovie, id: 'movie-2', status: MovieStatus.UPCOMING, releaseDate: pastDate },
        ];
        mockMovieRepo.find.mockResolvedValue(upcomingMovies);
        mockMovieRepo.save.mockResolvedValue({ ...upcomingMovies[0], status: MovieStatus.RUNNING });

        // Act
        const result = await service.transitionMoviesToRunning();

        // Assert
        expect(result.count).toBe(2);
        expect(movieRepo.save).toHaveBeenCalledTimes(2);
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors during find', async () => {
        // Arrange
        mockMovieRepo.find.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.transitionMoviesToRunning()).rejects.toThrow('Database error');
      });

      it('should handle repository errors during save', async () => {
        // Arrange
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - 1);

        const upcomingMovie = { ...mockMovie, status: MovieStatus.UPCOMING, releaseDate: pastDate };
        mockMovieRepo.find.mockResolvedValue([upcomingMovie]);
        mockMovieRepo.save.mockRejectedValue(new Error('Save error'));

        // Act & Assert
        await expect(service.transitionMoviesToRunning()).rejects.toThrow('Save error');
      });
    });
  });

  describe('findOneMovie', () => {
    describe('Success cases', () => {
      it('should return a movie by id', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);

        // Act
        const result = await service.findOneMovie('movie-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(movieRepo.findOne).toHaveBeenCalledWith({ 
          where: { id: 'movie-1' },
          relations: ['casts', 'crews']
        });
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when movie does not exist', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOneMovie('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOneMovie('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOneMovie(null as any)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('updateMovie', () => {
    describe('Success cases', () => {
      it('should update a movie successfully', async () => {
        // Arrange
        const dto: UpdateMovieDto = { name: 'Updated Movie' };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);

        // Act
        const result = await service.updateMovie('movie-1', dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(movieRepo.findOne).toHaveBeenCalledWith({ 
          where: { id: 'movie-1' },
          relations: ['casts', 'crews']
        });
        expect(movieRepo.save).toHaveBeenCalledWith(mockMovie);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when movie does not exist', async () => {
        // Arrange
        const dto: UpdateMovieDto = { name: 'Updated Movie' };
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateMovie('nonexistent', dto)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto: UpdateMovieDto = {};
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockMovieRepo.save.mockResolvedValue(mockMovie);

        // Act
        const result = await service.updateMovie('movie-1', dto);

        // Assert
        expect(movieRepo.save).toHaveBeenCalledWith(mockMovie);
      });
    });
  });

  describe('deleteMovie', () => {
    describe('Success cases', () => {
      it('should delete a movie successfully', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockMovieRepo.remove.mockResolvedValue(mockMovie);

        // Act
        const result = await service.deleteMovie('movie-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(movieRepo.findOne).toHaveBeenCalledWith({ where: { id: 'movie-1' } });
        expect(movieRepo.remove).toHaveBeenCalledWith(mockMovie);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when movie does not exist', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteMovie('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteMovie('')).rejects.toThrow(NotFoundException);
      });
    });
  });
});

