import { Body, Controller, Get, Post, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventPattern, MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { OrderMicroservice, RpcInterceptor } from '@app/common';
import { DeliveryStartedDto } from './dto/delivery-started.dto';
import { OrderStatus } from './entity/order.entity';
import { PaymentMethod } from './entity/payment.entity';

@Controller('order')
@OrderMicroservice.OrderServiceControllerMethods()
export class OrderController implements OrderMicroservice.OrderServiceController {
  constructor(private readonly orderService: OrderService) {}

  // GRPC 방식으로 연결
  async deliveryStarted(request: OrderMicroservice.DeliveryStartedRequest) {
    await this.orderService.changeOrderStatus(request.id, OrderStatus.deliveryStarted);
  }

  async createOrder(request: OrderMicroservice.CreateOrderRequest) {
    const order = await this.orderService.createOrder({
      ...request,
      payment: {
        ...request.payment,
        paymentMethod: request.payment?.paymentMethod as PaymentMethod
      }
    } as CreateOrderDto);

    if (!order) {
      throw new Error('주문 생성에 실패했습니다.');
    }

    // MongoDB Document를 CreateOrderResponse로 변환 (구조가 동일하므로 타입 캐스팅 활용)
    return {
      ...order.toObject(),  // MongoDB Document를 plain object로 변환
      payment: {
        ...order.payment,
        paymentId: order.payment.paymentId || '',
      }
    } as OrderMicroservice.CreateOrderResponse;
  }


  // @EventPattern({cmd: 'delivery_started'})
  // @UseInterceptors(RpcInterceptor)
  // async deliveryStarted(@Payload() payload: DeliveryStartedDto) {
  //   await this.orderService.changeOrderStatus(payload.id, OrderStatus.deliveryStarted);
  // }

  // @MessagePattern({cmd: 'create_order'})
  // async createOrder(@Payload() createOrderDto: CreateOrderDto) {
  //   return this.orderService.createOrder(createOrderDto);
  // }

  // @Post()
  // @UsePipes(ValidationPipe)
  // async createOrder(@Authorization() token: string, @Body() createOrderDto: CreateOrderDto) {
  //   return this.orderService.createOrder(createOrderDto, token);
  // }
}
