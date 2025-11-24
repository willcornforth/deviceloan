import { ListProductOutput, ProductService } from "../app/product-service";

export class HttpProductService implements ProductService {
    listProducts(): Promise<ListProductOutput> {
        throw new Error("Method not implemented.");
    }
}