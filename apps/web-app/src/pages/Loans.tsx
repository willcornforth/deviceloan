import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import TabSwitch from '../components/TabSwitch';
import LoanCard from '../components/LoanCard';
import { useLoans } from '../hooks/useLoans';
import { useLoanService } from '../hooks/useLoanService';

type TabType = 'active' | 'history';

function Loans() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const { activeLoans, pastLoans, loading, error, refetch } = useLoans();
  const { getLoanService } = useLoanService();
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);

  const handleReturnDevice = async (loanId: string) => {
    try {
      setReturningLoanId(loanId);
			
      const service = await getLoanService();
      await service.returnLoan({ loanId });

      await refetch();
    } catch (err) {
      console.error('Failed to return device:', err);
      alert(err instanceof Error ? err.message : 'Failed to return device');
    } finally {
      setReturningLoanId(null);
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
          title="My Loans" 
          subtitle="Track your current and past device loans" 
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
          title="My Loans" 
          subtitle="Track your current and past device loans" 
        />
        <div className="flex justify-center items-center py-20 text-red-600">
          Error loading loans: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBanner 
        title="My Loans" 
        subtitle="Track your current and past device loans" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabSwitch
          tabs={[
            { id: 'active', label: 'Active', count: activeLoans.length },
            { id: 'history', label: 'History', count: pastLoans.length }
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabType)}
        />
        <div>
          {activeTab === 'active' && (
            activeLoans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">You have no active loans.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    image={`https://placehold.co/400x300/e0e7ff/4f46e5?text=${loan.product.name}`}
                    device={loan.product.name}
                    category={loan.product.category}
                    loanDate={formatDate(loan.loanDate)}
                    returnDate={formatDate(loan.dueDate)}
                    status={loan.status}
                    isActive={true}
                    onReturn={() => handleReturnDevice(loan.id)}
                    isReturning={returningLoanId === loan.id}
                  />
                ))}
              </div>
            )
          )}
          {activeTab === 'history' && (
            pastLoans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">You have no loan history.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    image={`https://placehold.co/400x300/e0e7ff/4f46e5?text=${loan.product.name}`}
                    device={loan.product.name}
                    category={loan.product.category}
                    loanDate={formatDate(loan.loanDate)}
                    returnDate={formatDate(loan.dueDate)}
                    status={loan.status}
                    isActive={false}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Loans;
