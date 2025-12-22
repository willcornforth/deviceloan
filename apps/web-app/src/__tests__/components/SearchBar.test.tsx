import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../../components/SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        placeholder="Search devices..."
      />
    );

    expect(screen.getByPlaceholderText('Search devices...')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    render(
      <SearchBar
        value="MacBook"
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('MacBook');
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'iPad');

    expect(handleChange).toHaveBeenCalled();
    // onChange is called for each character typed
    expect(handleChange).toHaveBeenCalledTimes(4); // 'i', 'P', 'a', 'd'
  });

  it('uses default placeholder when not provided', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const { container } = render(
      <SearchBar
        value=""
        onChange={() => {}}
      />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
