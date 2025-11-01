import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SendPaymentNotificationDto } from './dto/send-payment-notification.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationStatus } from './entity/notification.entity';
import { constructMetadata, ORDER_SERVICE, OrderMicroservice } from '@app/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class NotificationService implements OnModuleInit {
  orderService: OrderMicroservice.OrderServiceClient;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,

    // GRPC 방식으로 연결
    @Inject(ORDER_SERVICE)
    private readonly orderMicroservice: ClientGrpc,

    // RabbitMQ 방식으로 연결
    // @Inject(ORDER_SERVICE)
    // private readonly orderService: ClientProxy,
  ){}
  onModuleInit() {
    this.orderService = this.orderMicroservice.getService<OrderMicroservice.OrderServiceClient>(
      'OrderService',
    );
  }


  async sendPaymentNotification(data: SendPaymentNotificationDto, metadata: Metadata){
    const notification = await this.createNotification(data.to);

    await this.sendEmail();

    await this.updateNotificationStatus(notification.id, NotificationStatus.sent);
  
    /// Cold observable vs Hot observable
    this.sendDeliveryStartedMessage(data.orderId, metadata);

    return this.notificationModel.findById(notification.id);
  }

  private sendDeliveryStartedMessage(id: string, metadata: Metadata){
    // GRPC 방식으로 연결
    return this.orderService.deliveryStarted({
      id,
    }, constructMetadata(NotificationService.name, 'sendDeliveryStartedMessage', metadata));
    
    // return this.orderService.emit(
    //   { cmd: 'delivery_started'},
    //   { id },
    // )
  }

  private async updateNotificationStatus(id: string, status: NotificationStatus){
    return this.notificationModel.findByIdAndUpdate(id, { status });
  }

  private async sendEmail(){
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async createNotification(to: string){
    return this.notificationModel.create({
      from: 'jc@codefactory.ai',
      to: to,
      subject: '배송이 시작됐습니다!',
      content: `${to}님! 주문하신 물건이 배송이 시작됐습니다.`
    })
  }
}