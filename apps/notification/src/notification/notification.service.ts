import { Inject, Injectable } from '@nestjs/common';
import { SendPaymentNotificationDto } from './dto/send-payment-notification.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationStatus } from './entity/notification.entity';
import { ORDER_SERVICE } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,

    @Inject(ORDER_SERVICE)
    private readonly orderService: ClientProxy,
  ){}


  async sendPaymentNotification(data: SendPaymentNotificationDto){
    const notification = await this.createNotification(data.to);

    await this.sendEmail();

    await this.updateNotificationStatus(notification.id, NotificationStatus.sent);
  
    /// Cold observable vs Hot observable
    this.sendDeliveryStartedMessage(data.orderId);

    return this.notificationModel.findById(notification.id);
  }

  private sendDeliveryStartedMessage(id: string){
    return this.orderService.emit(
      { cmd: 'delivery_started'},
      { id },
    )
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