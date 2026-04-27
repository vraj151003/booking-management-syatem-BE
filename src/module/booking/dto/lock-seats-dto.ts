import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsString, IsUUID } from "class-validator";

export class LockSeatsDto {
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
}
