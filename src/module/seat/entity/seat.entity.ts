import { SeatType } from "../../../common/constant";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Screen } from "../../screen/entity/screen.entity";

@Entity()
export class Seat{
    @PrimaryGeneratedColumn('uuid')
    id : string

    @Column()
    seatNumber : string

    @Column({
        type : "enum",
        enum : SeatType,
        default : SeatType.STANDARD,
    })
    seatType : SeatType

    @Column()
    row: string

    @Column()
    price : number

    @ManyToOne(() => Screen)
    screen : Screen
}
