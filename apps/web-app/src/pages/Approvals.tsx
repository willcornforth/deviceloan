import { useState, useMemo } from 'react';
import PageBanner from '../components/PageBanner';
import ApprovalCard from '../components/ApprovalCard';
import ActiveLoanCard from '../components/ActiveLoanCard';
import TabSwitch from '../components/TabSwitch';
import GroupBox from '../components/GroupBox';
import { usePendingApprovals } from '../hooks/usePendingApprovals';
import { useActiveLoans } from '../hooks/useActiveLoans';
import { useLoanService } from '../hooks/useLoanService';
import { LoanProductDTO } from '../domain/loans';

type TabId = 'pending' | 'active';

function Approvals() {
  const { pendingLoans, loading: pendingLoading, error: pendingError, refetch: refetchPending } = usePendingApprovals();
  const { activeLoans, loading: activeLoading, error: activeError, refetch: refetchActive } = useActiveLoans();
  const { getLoanService } = useLoanService();
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('pending');

  // Show loading if either tab is still loading on initial load, or show specific tab loading after
  const loading = (pendingLoading && activeTab === 'pending') || (activeLoading && activeTab === 'active');
  const error = activeTab === 'pending' ? pendingError : activeError;

  const handleApprove = async (loanId: string) => {
    try {
      setProcessingLoanId(loanId);
      const service = await getLoanService();
      await service.approveLoan({ loanId });
      await refetchPending();
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
      await refetchPending();
    } catch (err) {
      console.error('Failed to reject loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject loan');
    } finally {
      setProcessingLoanId(null);
    }
  };

  const handleReturn = async (loanId: string) => {
    try {
      setProcessingLoanId(loanId);
      const service = await getLoanService();
      await service.returnLoan({ loanId });
      // Refetch both to ensure data consistency across tabs
      await Promise.all([refetchActive(), refetchPending()]);
    } catch (err) {
      console.error('Failed to return loan:', err);
      alert(err instanceof Error ? err.message : 'Failed to return loan');
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

  // Group active loans by user - memoized for performance
  const groupedActiveLoans = useMemo(() => {
    return activeLoans.reduce((acc, loan) => {
      const userId = loan.userId;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(loan);
      return acc;
    }, {} as Record<string, LoanProductDTO[]>);
  }, [activeLoans]);

  const tabs = [
    { id: 'pending' as const, label: 'Pending Approvals', count: pendingLoans.length, badgeColor: 'yellow' as const },
    { id: 'active' as const, label: 'Active Loans', count: activeLoans.length, badgeColor: 'green' as const },
  ];

  if (loading) {
    return (
      <div>
        <PageBanner 
          title="Loan Management" 
          subtitle="Review and manage loan requests and active loans" 
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
          title="Loan Management" 
          subtitle="Review and manage loan requests and active loans" 
        />
        <div className="flex justify-center items-center py-20 text-red-600">
          Error loading data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBanner 
        title="Loan Management" 
        subtitle="Review and manage loan requests and active loans" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <TabSwitch tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <>
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
          </>
        )}

        {/* Active Loans Tab */}
        {activeTab === 'active' && (
          <>
            {/* Stats Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {activeLoans.length} active {activeLoans.length === 1 ? 'loan' : 'loans'}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Loan Cards Grouped by User */}
            {activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No active loans at the moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedActiveLoans).map(([userId, loans]) => (
                  <GroupBox
                    key={userId}
                    title={userId}
                    count={loans.length}
                    collapsible={true}
                    defaultExpanded={true}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loans.map((loan) => (
                        <ActiveLoanCard
                          key={loan.id}
                          image={`https://placehold.co/400x300/dcfce7/16a34a?text=${loan.product?.name ?? 'Device'}`}
                          device={loan.product?.name ?? 'Name Unavailable'}
                          category={loan.product?.category ?? 'Category Unavailable'}
                          loanDate={formatDate(loan.loanDate)}
                          dueDate={formatDate(loan.dueDate)}
                          userName={loan.userId}
                          userEmail={loan.userId}
                          onReturn={() => handleReturn(loan.id)}
                          isProcessing={processingLoanId === loan.id}
                        />
                      ))}
                    </div>
                  </GroupBox>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Approvals;
