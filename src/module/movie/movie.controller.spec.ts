import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieController', () => {
  let controller: MovieController;
  let service: MovieService;

  const mockMovie = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMovieService = {
    createMovie: jest.fn(),
    findAllMovies: jest.fn(),
    findUpcomingMovies: jest.fn(),
    findRunningMovies: jest.fn(),
    findTrendingMovies: jest.fn(),
    findOneMovie: jest.fn(),
    updateMovie: jest.fn(),
    deleteMovie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [
        {
          provide: MovieService,
          useValue: mockMovieService,
        },
      ],
    }).compile();

    controller = module.get<MovieController>(MovieController);
    service = module.get<MovieService>(MovieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
        mockMovieService.createMovie.mockResolvedValue({
          message: 'your movie created successfully',
          data: mockMovie,
        });

        // Act
        const result = await controller.createMovie(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(service.createMovie).toHaveBeenCalledWith(dto);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
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
        mockMovieService.createMovie.mockRejectedValue(new Error('Service error'));

        // Act & Assert
        await expect(controller.createMovie(dto)).rejects.toThrow('Service error');
      });
    });

    describe('Edge cases', () => {
      it('should handle null dto', async () => {
        // Arrange
        mockMovieService.createMovie.mockRejectedValue(new TypeError('Cannot read properties of null'));

        // Act & Assert
        await expect(controller.createMovie(null as any)).rejects.toThrow(TypeError);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockMovieService.createMovie.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

        // Act & Assert
        await expect(controller.createMovie(undefined as any)).rejects.toThrow(TypeError);
      });
    });
  });

  describe('getMovies', () => {
    describe('Success cases', () => {
      it('should return all movies', async () => {
        // Arrange
        mockMovieService.findAllMovies.mockResolvedValue({
          message: 'all movies fetched successfully',
          data: [mockMovie],
        });

        // Act
        const result = await controller.getMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(service.findAllMovies).toHaveBeenCalled();
      });

      it('should return empty array when no movies exist', async () => {
        // Arrange
        mockMovieService.findAllMovies.mockResolvedValue({
          message: 'all movies fetched successfully',
          data: [],
        });

      
        // Act
        const result = await controller.getMovies();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.findAllMovies.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('getUpcomingMovies', () => {
    describe('Success cases', () => {
      it('should return all upcoming movies', async () => {
        // Arrange
        mockMovieService.findUpcomingMovies.mockResolvedValue({
          message: 'upcoming movies fetched successfully',
          data: [mockMovie],
        });

        // Act
        const result = await controller.getUpcomingMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(service.findUpcomingMovies).toHaveBeenCalled();
      });

      it('should return empty array when no upcoming movies exist', async () => {
        // Arrange
        mockMovieService.findUpcomingMovies.mockResolvedValue({
          message: 'upcoming movies fetched successfully',
          data: [],
        });

        // Act
        const result = await controller.getUpcomingMovies();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.findUpcomingMovies.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getUpcomingMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('getRunningMovies', () => {
    describe('Success cases', () => {
      it('should return all running movies', async () => {
        // Arrange
        mockMovieService.findRunningMovies.mockResolvedValue({
          message: 'running movies fetched successfully',
          data: [mockMovie],
        });

        // Act
        const result = await controller.getRunningMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(service.findRunningMovies).toHaveBeenCalled();
      });

      it('should return empty array when no running movies exist', async () => {
        // Arrange
        mockMovieService.findRunningMovies.mockResolvedValue({
          message: 'running movies fetched successfully',
          data: [],
        });

        // Act
        const result = await controller.getRunningMovies();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.findRunningMovies.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getRunningMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('getTrendingMovies', () => {
    describe('Success cases', () => {
      it('should return top 10 trending movies', async () => {
        // Arrange
        mockMovieService.findTrendingMovies.mockResolvedValue({
          message: 'trending movies fetched successfully',
          data: [mockMovie],
        });

        // Act
        const result = await controller.getTrendingMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(service.findTrendingMovies).toHaveBeenCalled();
      });

      it('should return empty array when no trending movies exist', async () => {
        // Arrange
        mockMovieService.findTrendingMovies.mockResolvedValue({
          message: 'trending movies fetched successfully',
          data: [],
        });

        // Act
        const result = await controller.getTrendingMovies();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.findTrendingMovies.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.getTrendingMovies()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a movie by id', async () => {
        // Arrange
        mockMovieService.findOneMovie.mockResolvedValue({
          message: 'movie fetched successfully',
          data: mockMovie,
        });

        // Act
        const result = await controller.findOne('movie-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(service.findOneMovie).toHaveBeenCalledWith('movie-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.findOneMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockMovieService.findOneMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne('')).rejects.toThrow('Not found');
      });

      it('should handle null id', async () => {
        // Arrange
        mockMovieService.findOneMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(null as any)).rejects.toThrow('Not found');
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockMovieService.findOneMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne(undefined as any)).rejects.toThrow('Not found');
      });
    });
  });

  describe('updateMovie', () => {
    describe('Success cases', () => {
      it('should update a movie successfully', async () => {
        // Arrange
        const dto: UpdateMovieDto = { name: 'Updated Movie' };
        mockMovieService.updateMovie.mockResolvedValue({
          message: 'movie updated successfully',
          data: mockMovie,
        });

        // Act
        const result = await controller.updateMovie('movie-1', dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(service.updateMovie).toHaveBeenCalledWith('movie-1', dto);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: UpdateMovieDto = { name: 'Updated Movie' };
        mockMovieService.updateMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.updateMovie('nonexistent', dto)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto: UpdateMovieDto = {};
        mockMovieService.updateMovie.mockResolvedValue({
          message: 'movie updated successfully',
          data: mockMovie,
        });

        // Act
        const result = await controller.updateMovie('movie-1', dto);

        // Assert
        expect(service.updateMovie).toHaveBeenCalledWith('movie-1', dto);
      });

      it('should handle null dto', async () => {
        // Arrange
        mockMovieService.updateMovie.mockRejectedValue(new TypeError('Cannot read properties of null'));

        // Act & Assert
        await expect(controller.updateMovie('movie-1', null as any)).rejects.toThrow(TypeError);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockMovieService.updateMovie.mockRejectedValue(new TypeError('Cannot read properties of undefined'));

        // Act & Assert
        await expect(controller.updateMovie('movie-1', undefined as any)).rejects.toThrow(TypeError);
      });
    });
  });

  describe('deleteMovie', () => {
    describe('Success cases', () => {
      it('should delete a movie successfully', async () => {
        // Arrange
        mockMovieService.deleteMovie.mockResolvedValue({
          message: 'movie deleted successfully',
        });

        // Act
        const result = await controller.deleteMovie('movie-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(service.deleteMovie).toHaveBeenCalledWith('movie-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockMovieService.deleteMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteMovie('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockMovieService.deleteMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteMovie('')).rejects.toThrow('Not found');
      });

      it('should handle null id', async () => {
        // Arrange
        mockMovieService.deleteMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteMovie(null as any)).rejects.toThrow('Not found');
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockMovieService.deleteMovie.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.deleteMovie(undefined as any)).rejects.toThrow('Not found');
      });
    });
  });
});

