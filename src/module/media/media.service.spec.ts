import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary');

describe('MediaService', () => {
  let service: MediaService;

  const mockCloudinaryResult = {
    secure_url: 'https://res.cloudinary.com/test/image.jpg',
    public_id: 'test-folder/test-image',
    format: 'jpg',
    width: 800,
    height: 600,
    bytes: 102400,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockImageFile = {
    path: '/tmp/test-file.jpg',
    originalname: 'test-file.jpg',
    mimetype: 'image/jpeg',
  };

  const mockVideoFile = {
    path: '/tmp/test-video.mp4',
    originalname: 'test-video.mp4',
    mimetype: 'video/mp4',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaService],
    }).compile();

    service = module.get<MediaService>(MediaService);
    jest.clearAllMocks();
  });

  describe('uploadMedia', () => {
    it('should upload single image successfully', async () => {
      // Arrange
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(mockCloudinaryResult);

      // Act
      const result = await service.uploadMedia([mockImageFile as any]);

      // Assert
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockImageFile.path, {
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        max_file_size: 5 * 1024 * 1024,
      });
      expect(result).toMatchObject({
        url: mockCloudinaryResult.secure_url,
        publicId: mockCloudinaryResult.public_id,
        format: mockCloudinaryResult.format,
        width: mockCloudinaryResult.width,
        height: mockCloudinaryResult.height,
        bytes: mockCloudinaryResult.bytes,
      });
    });

    it('should upload single video successfully', async () => {
      // Arrange
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(mockCloudinaryResult);

      // Act
      const result = await service.uploadMedia([mockVideoFile as any]);

      // Assert
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockVideoFile.path, {
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        max_file_size: 50 * 1024 * 1024,
      });
      expect(result).toMatchObject({
        url: mockCloudinaryResult.secure_url,
        publicId: mockCloudinaryResult.public_id,
      });
    });

    it('should upload multiple media files successfully', async () => {
      // Arrange
      const mockFiles = [
        { ...mockImageFile, path: '/tmp/file1.jpg' },
        { ...mockImageFile, path: '/tmp/file2.jpg' },
      ];
      (cloudinary.uploader.upload as jest.Mock)
        .mockResolvedValueOnce({ ...mockCloudinaryResult, public_id: 'file1' })
        .mockResolvedValueOnce({ ...mockCloudinaryResult, public_id: 'file2' });

      // Act
      const result = await service.uploadMedia(mockFiles as any);

      // Assert
      expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].publicId).toBe('file1');
      expect(result[1].publicId).toBe('file2');
    });

    it('should throw BadRequestException when no files provided', async () => {
      // Act & Assert
      await expect(service.uploadMedia([])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadMedia([])).rejects.toThrow('No files provided');
    });

    it('should throw BadRequestException on upload failure', async () => {
      // Arrange
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(service.uploadMedia([mockImageFile as any])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadMedia([mockImageFile as any])).rejects.toThrow(
        'Failed to upload media: Upload failed',
      );
    });
  });

  describe('deleteMedia', () => {
    it('should delete media successfully', async () => {
      // Arrange
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      // Act
      const result = await service.deleteMedia('test-public-id');

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
      expect(result).toEqual({ message: 'Media deleted successfully' });
    });

    it('should throw BadRequestException on delete failure', async () => {
      // Arrange
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      // Act & Assert
      await expect(service.deleteMedia('test-public-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteMedia('test-public-id')).rejects.toThrow(
        'Failed to delete media: Delete failed',
      );
    });
  });
});
