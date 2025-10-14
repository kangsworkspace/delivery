import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
        isGlobal: true,
        validationSchema: Joi.object({
            HTTP_PORT: Joi.number().required(),
            DB_URL: Joi.string().required(),
        }),
    }),
    MongooseModule.forRootAsync({
        useFactory: (configService: ConfigService) => ({
            uri: configService.getOrThrow('DB_URL'),
        }),
        inject: [ConfigService]
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
