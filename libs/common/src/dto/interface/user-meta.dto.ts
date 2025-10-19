import { UserPayloadDto } from "../user-payload.dto"

export interface UserMetaDto {
    meta: {
        user: UserPayloadDto;
    }
}