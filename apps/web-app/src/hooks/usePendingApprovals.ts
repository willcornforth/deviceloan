import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { HttpLoanService } from '../infra/http-loan-service';
import { LoanProductDTO, LoanStatus } from '../domain/loans';

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
            const token = await getAccessTokenSilently();
            const service = new HttpLoanService(token);
            const output = await service.listPendingApprovals();
            setPendingLoans(output.loans);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently, isAuthenticated, isAuthLoading]);

    useEffect(() => {
        fetchPendingApprovals();
    }, [fetchPendingApprovals]);

    return { pendingLoans, loading, error, refetch: fetchPendingApprovals };
};
