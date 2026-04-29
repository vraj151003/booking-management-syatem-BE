import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { MediaUploadResponseDto } from './dto/media-upload.dto';

@Injectable()
export class MediaService {
  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  private isPdf(mimetype: string): boolean {
    return mimetype === 'application/pdf';
  }

  private isText(mimetype: string): boolean {
    return mimetype === 'text/plain' || mimetype === 'text/csv';
  }

  private async uploadSingleFile(file: any): Promise<MediaUploadResponseDto> {
    try {
      let resourceType: 'image' | 'video' | 'raw' = 'raw';
      let allowedFormats: string[] = [];
      let maxFileSize: number;

      if (this.isImage(file.mimetype)) {
        resourceType = 'image';
        allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        maxFileSize = 5 * 1024 * 1024; // 5MB for images
      } else if (this.isVideo(file.mimetype)) {
        resourceType = 'video';
        allowedFormats = ['mp4', 'mov', 'avi', 'webm'];
        maxFileSize = 50 * 1024 * 1024; // 50MB for videos
      } else if (this.isPdf(file.mimetype)) {
        resourceType = 'raw';
        allowedFormats = ['pdf'];
        maxFileSize = 10 * 1024 * 1024; // 10MB for PDFs
      } else if (this.isText(file.mimetype)) {
        resourceType = 'raw';
        allowedFormats = ['txt', 'csv'];
        maxFileSize = 2 * 1024 * 1024; // 2MB for text files
      } else {
        throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
      }

      const uploadOptions = {
        resource_type: resourceType,
        allowed_formats: allowedFormats,
        max_file_size: maxFileSize,
      };

      let result;
      if (file.buffer) {
        // Upload from buffer (memory storage)
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
      } else if (file.path) {
        // Upload from file path (disk storage)
        result = await cloudinary.uploader.upload(file.path, uploadOptions);
      } else {
        throw new Error('File must have either buffer or path property');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: new Date(result.created_at),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload media: ${error.message}`);
    }
  }

  async uploadMedia(files: any[]): Promise<MediaUploadResponseDto | MediaUploadResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length === 1) {
      return await this.uploadSingleFile(files[0]);
    }

    const uploadPromises = files.map(file => this.uploadSingleFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteMedia(publicId: string): Promise<{ message: string }> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { message: 'Media deleted successfully' };
    } catch (error) {
      throw new BadRequestException(`Failed to delete media: ${error.message}`);
    }
  }
}
