import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovieService } from './movie.service';
import { Movie } from './entity/movie.entity';
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMovieRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepo,
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

        // Act
        const result = await service.createMovie(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockMovie);
        expect(movieRepo.create).toHaveBeenCalled();
        expect(movieRepo.save).toHaveBeenCalledWith(mockMovie);
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
        });
      });
    });
  });

  describe('findAllMovies', () => {
    describe('Success cases', () => {
      it('should return all movies', async () => {
        // Arrange
        mockMovieRepo.find.mockResolvedValue([mockMovie]);

        // Act
        const result = await service.findAllMovies();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockMovie]);
        expect(movieRepo.find).toHaveBeenCalled();
      });

      it('should return empty array when no movies exist', async () => {
        // Arrange
        mockMovieRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.findAllMovies();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors', async () => {
        // Arrange
        mockMovieRepo.find.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAllMovies()).rejects.toThrow('Database error');
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
        expect(movieRepo.findOne).toHaveBeenCalledWith({ where: { id: 'movie-1' } });
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
        expect(movieRepo.findOne).toHaveBeenCalledWith({ where: { id: 'movie-1' } });
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

