import { Controller, Get, Post, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetProductsInfo } from './dto/get-products-info.dto';
import { RpcInterceptor } from '@app/common/interceptor/rpc.interceptor';
import { ProductMicroservice } from '@app/common';

@Controller('product')
@ProductMicroservice.ProductServiceControllerMethods()
export class ProductController implements ProductMicroservice.ProductServiceController {
  constructor(private readonly productService: ProductService) {}

  // GRPC 방식으로 연결
  async createSamples(){
    const resp = await this.productService.createSamples();

    return {
      success: resp,
    };
  }

  async getProductsInfo(request: GetProductsInfo){
    const resp = await this.productService.getProductsInfo(request.productIds);

    return {
      products: resp,
    };
  }

  // @MessagePattern({cmd: 'create_samples'})
  // createSamples(){
  //   return this.productService.createSamples();
  // }

  // @MessagePattern({cmd: 'get_products_info'})
  // @UsePipes(ValidationPipe)
  // @UseInterceptors(RpcInterceptor)
  // getProductsInfo(@Payload() data: GetProductsInfo){
  //   return this.productService.getProductsInfo(data.productIds)
  // }
}
