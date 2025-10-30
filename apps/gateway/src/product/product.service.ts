import { PRODUCT_SERVICE, ProductMicroservice } from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ProductService implements OnModuleInit{
    productService: ProductMicroservice.ProductServiceClient;

    constructor(
        // GRPC 방식으로 연결
        @Inject(PRODUCT_SERVICE)
        private readonly productMicroservice: ClientGrpc,

        // @Inject(PRODUCT_SERVICE)
        // private readonly productMicroservice: ClientProxy,
    ){}
    onModuleInit() {
        this.productService = this.productMicroservice.getService<ProductMicroservice.ProductServiceClient>(
            'ProductService',
        );
    }

    async createSamples(){
        return this.productService.createSamples({});

        // return lastValueFrom(this.productMicroservice.send(
        //     { cmd: 'create_samples' },
        //     {},
        // ))
    }
}
