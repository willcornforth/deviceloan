import { useState, useEffect } from 'react';
import { Product } from '../app/product-service';
import { HttpProductService } from '../infra/http-product-service';

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
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return { products, loading, error };
};
