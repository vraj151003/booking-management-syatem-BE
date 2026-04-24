import { PartialType } from "@nestjs/swagger";
import { CreateScreenDTO } from "./create-screen-dto";

export class UpdateScreenDTO extends PartialType(CreateScreenDTO) {}