import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE, UserMetaDto, UserPayloadDto } from '@app/common';

@Injectable()
export class OrderService {
    constructor(
        @Inject(ORDER_SERVICE)
        private readonly orderMicroservice: ClientProxy
    ){}

    async createOrder(createOrderDto: CreateOrderDto, userPayload: UserPayloadDto){
        return this.orderMicroservice.send<any, CreateOrderDto & UserMetaDto>(
            { cmd: 'create_order' },
            {
                ...createOrderDto,
                meta: {
                    user: userPayload,
                },
            },
        )
    }
}
