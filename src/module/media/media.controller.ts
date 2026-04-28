import { Controller, Post, Delete, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { MediaUploadResponseDto } from './dto/media-upload.dto';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload media files (single or multiple)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully', type: MediaUploadResponseDto })
  async uploadMedia(
    @UploadedFiles() files: any[],
  ): Promise<MediaUploadResponseDto | MediaUploadResponseDto[]> {
    return await this.mediaService.uploadMedia(files);
  }

  @Delete('delete/:publicId')
  @ApiOperation({ summary: 'Delete media by public ID' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  async deleteMedia(@Param('publicId') publicId: string) {
    return await this.mediaService.deleteMedia(publicId);
  }
}
