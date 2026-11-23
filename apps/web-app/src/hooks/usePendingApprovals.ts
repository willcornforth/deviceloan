import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { HttpLoanService } from '../infra/http-loan-service';
import { LoanProductDTO } from '../domain/loans';
import { ServiceError } from '../infra/service-error-handler';

export const usePendingApprovals = () => {
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
    const [pendingLoans, setPendingLoans] = useState<LoanProductDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchPendingApprovals = useCallback(async () => {
        if (isAuthLoading) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            let token: string;
            try {
                token = await getAccessTokenSilently();
            } catch (tokenError) {
                throw new Error('Failed to retrieve authentication token. Please log in again.');
            }
            
            const service = new HttpLoanService(token);
            const output = await service.listPendingApprovals();
            setPendingLoans(output.loans);
        } catch (err) {
            const message = err instanceof ServiceError
                ? err.userMessage
                : err instanceof Error
                    ? err.message
                    : 'Something went wrong while loading pending approvals. Please try again.';
            setError(new Error(message));
            console.error('Error fetching pending approvals:', err);
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently, isAuthenticated, isAuthLoading]);

    useEffect(() => {
        fetchPendingApprovals();
    }, [fetchPendingApprovals]);

    return { pendingLoans, loading, error, refetch: fetchPendingApprovals };
};
