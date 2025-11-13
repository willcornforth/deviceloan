import { Product, ProductService } from "./product-service";

export type ListProductResult =
    | { success: true; products: readonly Product[]; count: number; }
    | { success: false; products: readonly string[]; }

export type ListProductsUseCase = (service: ProductService) => Promise<ListProductResult>;

export const listProducts: ListProductsUseCase = async (service) => {
    try {
        const {products, count} = await service.listProducts();
        return {
            success: true,
            products: products,
            count: count,
        };
    } catch (error) {
        return {
            success: false,
            products: [(error instanceof Error) ? error.message : 'Unknown error'],
        };
    }
}