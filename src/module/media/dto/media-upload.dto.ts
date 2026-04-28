import { ApiProperty } from '@nestjs/swagger';

export class MediaUploadResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  publicId: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty()
  bytes: number;

  @ApiProperty()
  createdAt: Date;
}
