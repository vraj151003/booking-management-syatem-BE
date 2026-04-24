import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, IsUUID } from "class-validator";

export class LockSeatsDto {
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
