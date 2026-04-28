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

  private async uploadSingleFile(file: any): Promise<MediaUploadResponseDto> {
    try {
      const resourceType: 'image' | 'video' = this.isImage(file.mimetype) ? 'image' : 'video';
      const allowedFormats = this.isImage(file.mimetype) 
        ? ['jpg', 'jpeg', 'png', 'webp', 'gif'] 
        : ['mp4', 'mov', 'avi', 'webm'];
      const maxFileSize = this.isImage(file.mimetype) 
        ? 5 * 1024 * 1024 // 5MB for images
        : 50 * 1024 * 1024; // 50MB for videos

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

    console.log('Received files:', files.length);
    console.log('First file properties:', files[0] ? Object.keys(files[0]) : 'No file');

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
