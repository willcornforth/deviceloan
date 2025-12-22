import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeviceCard from '../../components/DeviceCard';

describe('DeviceCard', () => {
  const defaultProps = {
    image: 'https://example.com/device.jpg',
    name: 'MacBook Pro',
    category: 'Laptop',
    status: 'Available',
  };

  it('renders device information correctly', () => {
    render(<DeviceCard {...defaultProps} />);

    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders device image with correct alt text', () => {
    render(<DeviceCard {...defaultProps} />);

    const image = screen.getByAltText('MacBook Pro');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/device.jpg');
  });

  it('renders specs when provided', () => {
    render(<DeviceCard {...defaultProps} specs="16GB RAM, 512GB SSD" />);

    expect(screen.getByText('16GB RAM, 512GB SSD')).toBeInTheDocument();
  });

  it('renders button with default text', () => {
    render(<DeviceCard {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Loan Device' })).toBeInTheDocument();
  });

  it('renders button with custom text', () => {
    render(<DeviceCard {...defaultProps} buttonText="Reserve Now" />);

    expect(screen.getByRole('button', { name: 'Reserve Now' })).toBeInTheDocument();
  });

  it('disables button when buttonDisabled is true', () => {
    render(<DeviceCard {...defaultProps} buttonDisabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onButtonClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<DeviceCard {...defaultProps} onButtonClick={handleClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onButtonClick when button is disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <DeviceCard
        {...defaultProps}
        buttonDisabled={true}
        onButtonClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies correct styling for available status', () => {
    render(<DeviceCard {...defaultProps} status="Available" />);

    const statusBadge = screen.getByText('Available');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('applies correct styling for reserved status', () => {
    render(<DeviceCard {...defaultProps} status="Reserved" />);

    const statusBadge = screen.getByText('Reserved');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});
