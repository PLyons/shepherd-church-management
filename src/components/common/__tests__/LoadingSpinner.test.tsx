import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-b-2',
      'border-blue-600',
      'h-8',
      'w-8'
    );
  });

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    const customClass = 'my-custom-class';
    const { container } = render(<LoadingSpinner className={customClass} />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass(customClass);
  });

  it('maintains base classes when custom className is provided', () => {
    const { container } = render(<LoadingSpinner className="custom" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-b-2',
      'border-blue-600',
      'custom'
    );
  });
});
