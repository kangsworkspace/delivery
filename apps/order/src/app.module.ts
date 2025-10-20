import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { OrderModule } from './order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PAYMENT_SERVICE, PRODUCT_SERVICE, USER_SERVICE } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        USER_HOST: Joi.string().required(),
        USER_TCP_PORT: Joi.number().required(),
        DB_URL: Joi.string().required(),
        PRODUCT_HOST: Joi.string().required(),
        PRODUCT_TCP_PORT: Joi.number().required(),
        PAYMENT_HOST: Joi.string().required(),
        PAYMENT_TCP_PORT: Joi.number().required(),
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
          name: USER_SERVICE,
          useFactory: (configService: ConfigService) => ({
            // Redis 방식으로 연결
            transport: Transport.REDIS,
            options: {
                host: 'redis',
                port: 6379,
            }

            // TCP 방식으로 연결
            // transport: Transport.TCP,
            // options: {
            //   host: configService.getOrThrow('USER_HOST'),
            //   port: configService.getOrThrow('USER_TCP_PORT'),
            // },
          }),
          inject: [ConfigService]
        }
      ],
      isGlobal: true,
    }),
    ClientsModule.registerAsync({
      clients: [
        { 
          name: PRODUCT_SERVICE,
          useFactory: (configService: ConfigService) => ({
            // Redis 방식으로 연결
            transport: Transport.REDIS,
            options: {
                host: 'redis',
                port: 6379,
            }

            // TCP 방식으로 연결
            // transport: Transport.TCP,
            // options: {
            //   host: configService.getOrThrow('PRODUCT_HOST'),
            //   port: configService.getOrThrow('PRODUCT_TCP_PORT'),
            // },
          }),
          inject: [ConfigService]
        }
      ],
      isGlobal: true,
    }),
    ClientsModule.registerAsync({
      clients: [
        { 
          name: PAYMENT_SERVICE,
          useFactory: (configService: ConfigService) => ({
            // Redis 방식으로 연결
            transport: Transport.REDIS,
            options: {
                host: 'redis',
                port: 6379,
            }

            // TCP 방식으로 연결
            // transport: Transport.TCP,
            // options: {
            //   host: configService.getOrThrow('PAYMENT_HOST'),
            //   port: configService.getOrThrow('PAYMENT_TCP_PORT'),
            // },
          }),
          inject: [ConfigService]
        }
      ],
      isGlobal: true,
    }),
    OrderModule,
  ],
})
export class AppModule {}