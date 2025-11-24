import { useState } from 'react';
import PageBanner from '../components/PageBanner';
import TabSwitch from '../components/TabSwitch';
import LoanCard from '../components/LoanCard';
import { Loan } from '../domain/Loan';

type TabType = 'active' | 'history';

function Loans() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activeLoans] = useState<Loan[]>([
    { 
      id: 1, 
      device: 'MacBook Pro 16"', 
      category: 'Laptop',
      loanDate: '2025-11-20', 
      returnDate: '2025-12-04', 
      status: 'Active',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=MacBook+Pro'
    },
    { 
      id: 2, 
      device: 'iPad Pro 12.9"', 
      category: 'Tablet',
      loanDate: '2025-11-18', 
      returnDate: '2025-12-02', 
      status: 'Active',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=iPad+Pro'
    },
    { 
      id: 3, 
      device: 'Magic Mouse', 
      category: 'Accessory',
      loanDate: '2025-11-15', 
      returnDate: '2025-11-29', 
      status: 'Active',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Magic+Mouse'
    },
    { 
      id: 4, 
      device: 'Dell XPS 15', 
      category: 'Laptop',
      loanDate: '2025-11-22', 
      returnDate: '2025-11-25', 
      status: 'Overdue',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Dell+XPS'
    },
  ]);

  const [pastLoans] = useState<Loan[]>([
    { 
      id: 5, 
      device: 'iPhone 15 Pro', 
      category: 'Phone',
      loanDate: '2025-10-15', 
      returnDate: '2025-10-29', 
      status: 'Returned',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=iPhone+15'
    },
    { 
      id: 6, 
      device: 'Surface Pro 9', 
      category: 'Tablet',
      loanDate: '2025-09-10', 
      returnDate: '2025-09-24', 
      status: 'Returned',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Surface+Pro'
    },
    { 
      id: 7, 
      device: 'Samsung Galaxy Tab', 
      category: 'Tablet',
      loanDate: '2025-08-05', 
      returnDate: '2025-08-19', 
      status: 'Returned',
      image: 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Galaxy+Tab'
    },
  ]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  image={loan.image}
                  device={loan.device}
                  category={loan.category}
                  loanDate={loan.loanDate}
                  returnDate={loan.returnDate}
                  status={loan.status}
                  isActive={true}
                />
              ))}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  image={loan.image}
                  device={loan.device}
                  category={loan.category}
                  loanDate={loan.loanDate}
                  returnDate={loan.returnDate}
                  status={loan.status}
                  isActive={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Loans;
