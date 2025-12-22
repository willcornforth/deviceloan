import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabSwitch from '../../components/TabSwitch';

describe('TabSwitch', () => {
  const mockTabs = [
    { id: 'available', label: 'Available', count: 5 },
    { id: 'loaned', label: 'Loaned', count: 3 },
    { id: 'maintenance', label: 'Maintenance', count: 1 },
  ];

  it('renders all tabs with labels and counts', () => {
    render(
      <TabSwitch
        tabs={mockTabs}
        activeTab="available"
        onTabChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Available (5)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Loaned (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maintenance (1)' })).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(
      <TabSwitch
        tabs={mockTabs}
        activeTab="loaned"
        onTabChange={() => {}}
      />
    );

    const loanedTab = screen.getByRole('button', { name: 'Loaned (3)' });
    expect(loanedTab).toHaveClass('bg-white', 'text-indigo-700', 'shadow');
  });

  it('does not highlight inactive tabs', () => {
    render(
      <TabSwitch
        tabs={mockTabs}
        activeTab="loaned"
        onTabChange={() => {}}
      />
    );

    const availableTab = screen.getByRole('button', { name: 'Available (5)' });
    expect(availableTab).toHaveClass('text-gray-600');
    expect(availableTab).not.toHaveClass('bg-white', 'text-indigo-700');
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();

    render(
      <TabSwitch
        tabs={mockTabs}
        activeTab="available"
        onTabChange={handleTabChange}
      />
    );

    const loanedTab = screen.getByRole('button', { name: 'Loaned (3)' });
    await user.click(loanedTab);

    expect(handleTabChange).toHaveBeenCalledWith('loaned');
  });

  it('renders correctly with single tab', () => {
    const singleTab = [{ id: 'all', label: 'All Items', count: 10 }];

    render(
      <TabSwitch
        tabs={singleTab}
        activeTab="all"
        onTabChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'All Items (10)' })).toBeInTheDocument();
  });

  it('handles zero count correctly', () => {
    const tabsWithZero = [
      { id: 'empty', label: 'Empty', count: 0 },
    ];

    render(
      <TabSwitch
        tabs={tabsWithZero}
        activeTab="empty"
        onTabChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'Empty (0)' })).toBeInTheDocument();
  });
});
