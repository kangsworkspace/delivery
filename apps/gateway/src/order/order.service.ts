import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE, OrderMicroservice, UserMetaDto, UserPayloadDto } from '@app/common';

@Injectable()
export class OrderService implements OnModuleInit{
    orderService: OrderMicroservice.OrderServiceClient;
    
    constructor(
        // GRPC 방식으로 연결
        @Inject(ORDER_SERVICE)
        private readonly orderMicroservice: ClientGrpc,

        // @Inject(ORDER_SERVICE)
        // private readonly orderMicroservice: ClientProxy
    ){}
    onModuleInit() {
        this.orderService = this.orderMicroservice.getService<OrderMicroservice.OrderServiceClient>(
            'OrderService',
        );
    }

    async createOrder(createOrderDto: CreateOrderDto, userPayload: UserPayloadDto){
        // GRPC 방식으로 연결
        return this.orderService.createOrder({
            ...createOrderDto,
            meta: {
                user: userPayload,
            },
        });

        // return this.orderMicroservice.send<any, CreateOrderDto & UserMetaDto>(
        //     { cmd: 'create_order' },
        //     {
        //         ...createOrderDto,
        //         meta: {
        //             user: userPayload,
        //         },
        //     },
        // )
    }
}
