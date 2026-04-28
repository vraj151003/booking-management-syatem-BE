import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsString, IsUUID, IsOptional } from "class-validator";

export class CreateBookingDto {
    @ApiProperty()
    @IsUUID()
    showId: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @IsUUID('4', { each: true })
    seatIds: string[];

    @ApiProperty()
    @IsUUID()
    userId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    couponCode?: string;
}