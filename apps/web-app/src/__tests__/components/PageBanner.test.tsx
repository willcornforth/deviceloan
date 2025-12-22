import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageBanner from '../../components/PageBanner';

describe('PageBanner', () => {
  it('renders title and subtitle', () => {
    render(
      <PageBanner
        title="Device Loans"
        subtitle="Borrow devices for your work"
      />
    );

    expect(screen.getByText('Device Loans')).toBeInTheDocument();
    expect(screen.getByText('Borrow devices for your work')).toBeInTheDocument();
  });

  it('renders title as h1 heading', () => {
    render(
      <PageBanner
        title="My Devices"
        subtitle="Manage your loans"
      />
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('My Devices');
  });

  it('applies gradient background styling', () => {
    const { container } = render(
      <PageBanner
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    const banner = container.querySelector('.bg-gradient-to-r');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveClass('from-indigo-800', 'to-indigo-500');
  });

  it('renders with empty strings', () => {
    render(<PageBanner title="" subtitle="" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('');
  });

  it('handles long text content', () => {
    const longTitle = 'This is a very long title that should still render correctly';
    const longSubtitle = 'This is a very long subtitle with lots of descriptive text about the page';

    render(<PageBanner title={longTitle} subtitle={longSubtitle} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longSubtitle)).toBeInTheDocument();
  });
});
