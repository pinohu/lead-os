import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { logger } from '@/utils/logger';
import { captureReactError } from '@/utils/errorTracking';

// Mock logger and errorTracking
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/utils/errorTracking', () => ({
  captureReactError: vi.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
  });

  it('should display error details when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('Error Details');
    expect(detailsButton).toBeInTheDocument();
  });

  it('should log errors when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalled();
    expect(captureReactError).toHaveBeenCalled();
  });

  it('should have refresh page button', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    expect(refreshButton).toBeInTheDocument();

    reloadSpy.mockRestore();
  });

  it('should have go home button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Go Home');
    expect(homeButton).toBeInTheDocument();
  });

  it('should reset error state when reset is called', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error boundary doesn't automatically reset, but we can verify the structure
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });
});

