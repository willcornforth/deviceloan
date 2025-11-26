import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { HttpLoanService } from '../infra/http-loan-service';
import { LoanProductDTO, LoanStatus } from '../domain/loans';

export const useLoans = () => {
    const { getAccessTokenSilently, isAuthenticated, isLoading: isAuthLoading, user } = useAuth0();
    const [loans, setLoans] = useState<LoanProductDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchLoans = useCallback(async () => {
        if (isAuthLoading) return;

        if (!isAuthenticated || !user?.sub) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessTokenSilently();
            const service = new HttpLoanService(token);
            const output = await service.listLoans({ userId: user.sub });
            setLoans(output.loans);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [getAccessTokenSilently, isAuthenticated, isAuthLoading, user?.sub]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const activeLoans = loans.filter(
        (loan) => loan.status === LoanStatus.Active || loan.status === LoanStatus.Overdue
    );

    const pastLoans = loans.filter(
        (loan) => loan.status === LoanStatus.Returned || loan.status === LoanStatus.Cancelled || loan.status === LoanStatus.Rejected
    );

    const pendingLoans = loans.filter(
        (loan) => loan.status === LoanStatus.PendingApproval
    );

    const rejectedLoans = loans.filter(
        (loan) => loan.status === LoanStatus.Rejected
    );

    return { loans, activeLoans, pastLoans, pendingLoans, rejectedLoans, loading, error, refetch: fetchLoans };
};
