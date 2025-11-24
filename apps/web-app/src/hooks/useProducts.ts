import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Product } from '../app/product-service';
import { HttpProductService } from '../infra/http-product-service';

export const useProducts = () => {
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            if (isAuthLoading) return;
            
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                const token = await getAccessTokenSilently();
                const service = new HttpProductService(token);
                const output = await service.listProducts();
                setProducts(output.products);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [getAccessTokenSilently, isAuthenticated, isAuthLoading]);

    return { products, loading, error };
};
