import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteService } from './favorite.service';
import { Favorite, FavoritableType } from './entity/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteRepo: jest.Mocked<Repository<Favorite>>;

  const createMockFavorite = (): Favorite => ({
    id: 'fav-123',
    userId: 'user-123',
    favoritableType: FavoritableType.MOVIE,
    favoritableId: 'movie-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockFavoriteRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockFavoriteRepo,
        },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
    favoriteRepo = module.get(getRepositoryToken(Favorite));
    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    const dto: CreateFavoriteDto = {
      favoritableType: FavoritableType.MOVIE,
      favoritableId: 'movie-123',
    };

    it('should add favorite successfully', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(null);
      mockFavoriteRepo.create.mockReturnValue(createMockFavorite());
      mockFavoriteRepo.save.mockResolvedValue(createMockFavorite());

      // Act
      const result = await service.addFavorite('user-123', dto);

      // Assert
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          favoritableType: FavoritableType.MOVIE,
          favoritableId: 'movie-123',
        },
      });
      expect(mockFavoriteRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        favoritableType: FavoritableType.MOVIE,
        favoritableId: 'movie-123',
      });
      expect(mockFavoriteRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        userId: 'user-123',
        favoritableType: FavoritableType.MOVIE,
        favoritableId: 'movie-123',
      });
    });

    it('should throw error if item already favorited', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(createMockFavorite());

      // Act & Assert
      await expect(service.addFavorite('user-123', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addFavorite('user-123', dto)).rejects.toThrow(
        'Item already in favorites',
      );
    });

    it('should add theater favorite successfully', async () => {
      // Arrange
      const theaterDto: CreateFavoriteDto = {
        favoritableType: FavoritableType.THEATER,
        favoritableId: 'theater-123',
      };
      mockFavoriteRepo.findOne.mockResolvedValue(null);
      mockFavoriteRepo.create.mockReturnValue(createMockFavorite());
      mockFavoriteRepo.save.mockResolvedValue(createMockFavorite());

      // Act
      await service.addFavorite('user-123', theaterDto);

      // Assert
      expect(mockFavoriteRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        favoritableType: FavoritableType.THEATER,
        favoritableId: 'theater-123',
      });
    });
  });

  describe('findAllFavorites', () => {
    it('should return all user favorites ordered by createdAt DESC', async () => {
      // Arrange
      const favorites = [createMockFavorite(), { ...createMockFavorite(), id: 'fav-456' }];
      mockFavoriteRepo.find.mockResolvedValue(favorites);

      // Act
      const result = await service.findAllFavorites('user-123');

      // Assert
      expect(mockFavoriteRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(favorites);
    });

    it('should return empty array when no favorites exist', async () => {
      // Arrange
      mockFavoriteRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllFavorites('user-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findFavoritesByType', () => {
    it('should return favorites by type', async () => {
      // Arrange
      const movieFavorites = [createMockFavorite()];
      mockFavoriteRepo.find.mockResolvedValue(movieFavorites);

      // Act
      const result = await service.findFavoritesByType('user-123', FavoritableType.MOVIE);

      // Assert
      expect(mockFavoriteRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          favoritableType: FavoritableType.MOVIE,
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(movieFavorites);
    });

    it('should return theater favorites', async () => {
      // Arrange
      const theaterFavorites = [{ ...createMockFavorite(), favoritableType: FavoritableType.THEATER }];
      mockFavoriteRepo.find.mockResolvedValue(theaterFavorites);

      // Act
      const result = await service.findFavoritesByType('user-123', FavoritableType.THEATER);

      // Assert
      expect(mockFavoriteRepo.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          favoritableType: FavoritableType.THEATER,
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOneFavorite', () => {
    it('should return favorite by id', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(createMockFavorite());

      // Act
      const result = await service.findOneFavorite('fav-123', 'user-123');

      // Assert
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'fav-123', userId: 'user-123' },
      });
      expect(result).toMatchObject({
        id: 'fav-123',
        userId: 'user-123',
      });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneFavorite('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneFavorite('invalid-id', 'user-123')).rejects.toThrow(
        'Favorite not found',
      );
    });

    it('should throw NotFoundException when favorite belongs to different user', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneFavorite('fav-123', 'other-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite successfully', async () => {
      // Arrange
      const favorite = createMockFavorite();
      mockFavoriteRepo.findOne.mockResolvedValue(favorite);
      mockFavoriteRepo.remove.mockResolvedValue(favorite);

      // Act
      const result = await service.removeFavorite('fav-123', 'user-123');

      // Assert
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'fav-123', userId: 'user-123' },
      });
      expect(mockFavoriteRepo.remove).toHaveBeenCalledWith(favorite);
      expect(result).toEqual({ message: 'Favorite removed successfully' });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeFavorite('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFavoriteByItem', () => {
    it('should remove favorite by item type and id', async () => {
      // Arrange
      const favorite = createMockFavorite();
      mockFavoriteRepo.findOne.mockResolvedValue(favorite);
      mockFavoriteRepo.remove.mockResolvedValue(favorite);

      // Act
      const result = await service.removeFavoriteByItem(
        'user-123',
        FavoritableType.MOVIE,
        'movie-123',
      );

      // Assert
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          favoritableType: FavoritableType.MOVIE,
          favoritableId: 'movie-123',
        },
      });
      expect(mockFavoriteRepo.remove).toHaveBeenCalledWith(favorite);
      expect(result).toEqual({ message: 'Favorite removed successfully' });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      // Arrange
      mockFavoriteRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removeFavoriteByItem('user-123', FavoritableType.MOVIE, 'movie-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove theater favorite by item', async () => {
      // Arrange
      const theaterFavorite = { ...createMockFavorite(), favoritableType: FavoritableType.THEATER };
      mockFavoriteRepo.findOne.mockResolvedValue(theaterFavorite);
      mockFavoriteRepo.remove.mockResolvedValue(theaterFavorite);

      // Act
      await service.removeFavoriteByItem('user-123', FavoritableType.THEATER, 'theater-123');

      // Assert
      expect(mockFavoriteRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          favoritableType: FavoritableType.THEATER,
          favoritableId: 'theater-123',
        },
      });
    });
  });
});
