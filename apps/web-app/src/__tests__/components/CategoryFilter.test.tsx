import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter, { Category } from '../../components/CategoryFilter';

describe('CategoryFilter', () => {
  const mockCategories: Category[] = [
    { name: 'All Devices', icon: null },
    { name: 'Laptop', icon: null },
    { name: 'Tablet', icon: null },
  ];

  it('renders all category buttons', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="All Devices"
        onCategoryChange={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: 'All Devices' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Laptop' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tablet' })).toBeInTheDocument();
  });

  it('highlights the selected category', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Laptop"
        onCategoryChange={() => {}}
      />
    );

    const laptopButton = screen.getByRole('button', { name: 'Laptop' });
    expect(laptopButton).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('does not highlight unselected categories', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Laptop"
        onCategoryChange={() => {}}
      />
    );

    const tabletButton = screen.getByRole('button', { name: 'Tablet' });
    expect(tabletButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('calls onCategoryChange when a category is clicked', async () => {
    const user = userEvent.setup();
    const handleCategoryChange = vi.fn();

    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="All Devices"
        onCategoryChange={handleCategoryChange}
      />
    );

    const laptopButton = screen.getByRole('button', { name: 'Laptop' });
    await user.click(laptopButton);

    expect(handleCategoryChange).toHaveBeenCalledWith('Laptop');
  });

  it('renders with icons when provided', () => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid="mock-icon" className={className} />
    );

    const categoriesWithIcons: Category[] = [
      { name: 'Laptop', icon: MockIcon },
    ];

    render(
      <CategoryFilter
        categories={categoriesWithIcons}
        selectedCategory="Laptop"
        onCategoryChange={() => {}}
      />
    );

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
});
