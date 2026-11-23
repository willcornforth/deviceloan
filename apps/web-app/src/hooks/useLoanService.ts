import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';
import { HttpLoanService } from '../infra/http-loan-service';

export const useLoanService = () => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();

    const getLoanService = useMemo(() => {
        return async (): Promise<HttpLoanService> => {
            if (!isAuthenticated) {
                throw new Error('User must be authenticated to use loan service');
            }

            const token = await getAccessTokenSilently();
            return new HttpLoanService(token);
        };
    }, [getAccessTokenSilently, isAuthenticated]);

    return { getLoanService, isAuthenticated };
};
