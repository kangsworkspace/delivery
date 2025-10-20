import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi'
import { PaymentModule } from './payment/payment.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '@app/common';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                DB_URL: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                type: 'postgres', // 데이터베이스 타입을 PostgreSQL로 설정
                url: configService.getOrThrow('DB_URL'), // 환경변수에서 DB_URL을 가져와서 연결 URL로 사용
                autoLoadEntities: true, // 엔티티 파일들을 자동으로 로드하여 TypeORM이 인식하도록 설정
                synchronize: true, // 개발 환경에서 스키마를 자동으로 동기화 (프로덕션에서는 false 권장)
            }),
            inject: [ConfigService]
        }),
        ClientsModule.registerAsync({
            clients: [
              { 
                name: NOTIFICATION_SERVICE,
                useFactory: (configService: ConfigService) => ({
                  // RabbitMQ 방식으로 연결
                  transport: Transport.RMQ,
                  options: {
                      urls: ['amqp://rabbitmq:5672'],
                      queue: 'notification_queue',
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
                  //   host: configService.getOrThrow('NOTIFICATION_HOST'),
                  //   port: configService.getOrThrow('NOTIFICATION_TCP_PORT'),
                  // },
                }),
                inject: [ConfigService]
              }
            ],
            isGlobal: true,
        }),
        PaymentModule,
    ],
})
export class AppModule {}