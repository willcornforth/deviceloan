import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import ApprovalCard from '../components/ApprovalCard';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import { useLoanService } from '../hooks/useLoanService';

function Approvals() {
  const { pendingLoans, loading, error, refetch } = usePendingApprovals();
  const { getLoanService } = useLoanService();
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);

  const handleApprove = async (loanId: string) => {
    try {
      setProcessingLoanId(loanId);
      const service = await getLoanService();
      await service.approveLoan({ loanId });
      await refetch();
    } catch (err) {
      console.error('Failed to approve loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve loan');
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      setProcessingLoanId(loanId);
      const service = await getLoanService();
      await service.rejectLoan({ loanId });
      await refetch();
    } catch (err) {
      console.error('Failed to reject loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject loan');
    } finally {
      setProcessingLoanId(null);
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div>
        <PageBanner 
          title="Loan Approvals" 
          subtitle="Review and approve pending loan requests" 
        />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageBanner 
          title="Loan Approvals" 
          subtitle="Review and approve pending loan requests" 
        />
        <div className="flex justify-center items-center py-20 text-red-600">
          Error loading approvals: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBanner 
        title="Loan Approvals" 
        subtitle="Review and approve pending loan requests" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {pendingLoans.length} pending {pendingLoans.length === 1 ? 'request' : 'requests'}
              </span>
            </div>
          </div>
        </div>

        {/* Approval Cards */}
        {pendingLoans.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingLoans.map((loan) => (
              <ApprovalCard
                key={loan.id}
                image={`https://placehold.co/400x300/e0e7ff/4f46e5?text=${loan.product?.name ?? 'Device'}`}
                device={loan.product?.name ?? 'Name Unavailable'}
                category={loan.product?.category ?? 'Category Unavailable'}
                requestDate={formatDate(loan.createdAt)}
                dueDate={formatDate(loan.dueDate)}
                userName={loan.userId}
                userEmail={loan.userId}
                onApprove={() => handleApprove(loan.id)}
                onReject={() => handleReject(loan.id)}
                isProcessing={processingLoanId === loan.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Approvals;
