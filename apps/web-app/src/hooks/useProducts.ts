import { useState, useEffect } from 'react';
import { Product } from '../app/product-service';
import { HttpProductService } from '../infra/http-product-service';
import { ServiceError } from '../infra/service-error-handler';

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const service = new HttpProductService();
                const output = await service.listProducts();
                setProducts(output.products);
            } catch (err) {
                const message = err instanceof ServiceError
                    ? err.userMessage
                    : err instanceof Error
                        ? err.message
                        : 'Something went wrong while loading products. Please try again.';
                setError(new Error(message));
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return { products, loading, error };
};
