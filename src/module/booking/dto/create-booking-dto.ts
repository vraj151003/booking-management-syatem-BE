import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, IsUUID } from "class-validator";

export class CreateBookingDto {
    @ApiProperty()
    @IsUUID()
    showId: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    seatIds: string[];

    @ApiProperty()
    @IsUUID()
    userId: string;
}