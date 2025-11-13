import { Product, ProductService } from "../app/product-service";

export class HttpProductService implements ProductService {
    listProducts(): Promise<Product[]> {
        throw new Error("Method not implemented.");
    }
}