import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import * as Joi from 'joi'
import { NotificationModule } from "./notification/notification.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ORDER_SERVICE } from "@app/common";

@Module({
    imports: [
      ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: Joi.object({
              DB_URL: Joi.string().required(),
          }),
      }),
      MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
              uri: configService.getOrThrow('DB_URL'),
          }),
          inject: [ConfigService]
      }),
      ClientsModule.registerAsync({
        clients: [
          { 
            name: ORDER_SERVICE,
            useFactory: (configService: ConfigService) => ({
              // RabbitMQ 방식으로 연결
              transport: Transport.RMQ,
              options: {
                  urls: ['amqp://rabbitmq:5672'],
                  queue: 'order_queue',
                  queueOptions: {
                      durable: false,
                  }
              }

              // Redis 방식으로 연결
              // transport: Transport.REDIS,
              // options: {
              //     host: 'redis',
              //     port: 6379,
              // }

              // TCP 방식으로 연결
              // transport: Transport.TCP,
              // options: {
              //   host: configService.getOrThrow('ORDER_HOST'),
              //   port: configService.getOrThrow('ORDER_TCP_PORT'),
              // },
            }),
            inject: [ConfigService]
          }
        ],
        isGlobal: true,
      }),
      NotificationModule,
    ],
  })
  export class AppModule {}