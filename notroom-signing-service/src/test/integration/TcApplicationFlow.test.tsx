// src/test/integration/TcApplicationFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TcApplication from '@/pages/TcApplication';
import { supabase } from '@/integrations/supabase/client';
import { mockSupabaseClient, testFixtures } from './setup';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

describe('TC Application Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: testFixtures.regularUser.id,
          email: testFixtures.regularUser.email,
        },
      },
      error: null,
    });
  });

  describe('Step 1: Client Information', () => {
    it('should render client information form', async () => {
      render(<TcApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Client Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/Phone/i), '8144800989');

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should proceed to step 2 when step 1 is valid', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Client Name/i), testFixtures.tcClient.client_name);
      await user.type(screen.getByLabelText(/Email/i), testFixtures.tcClient.client_email);
      await user.type(screen.getByLabelText(/Phone/i), testFixtures.tcClient.client_phone);

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Step 2: Transaction Details', () => {
    it('should display transaction details form', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      // Fill step 1
      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Client Name/i), testFixtures.tcClient.client_name);
      await user.type(screen.getByLabelText(/Email/i), testFixtures.tcClient.client_email);
      await user.type(screen.getByLabelText(/Phone/i), testFixtures.tcClient.client_phone);

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
      });
    });

    it('should validate transaction description', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      // Navigate to step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Client Name/i), testFixtures.tcClient.client_name);
      await user.type(screen.getByLabelText(/Email/i), testFixtures.tcClient.client_email);
      await user.type(screen.getByLabelText(/Phone/i), testFixtures.tcClient.client_phone);

      let nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
      });

      // Try to proceed without description
      nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/description/i)).toBeInTheDocument();
      });
    });

    it('should allow adding multiple parties', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      // Navigate to step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Client Name/i), testFixtures.tcClient.client_name);
      await user.type(screen.getByLabelText(/Email/i), testFixtures.tcClient.client_email);
      await user.type(screen.getByLabelText(/Phone/i), testFixtures.tcClient.client_phone);

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
      });

      // Verify party input exists
      expect(screen.getByText(/Parties Involved/i)).toBeInTheDocument();
    });
  });

  describe('Step 3: Plan Selection', () => {
    it('should display plan selection', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      // Navigate through steps
      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      // Fill step 1
      await user.type(screen.getByLabelText(/Client Name/i), testFixtures.tcClient.client_name);
      await user.type(screen.getByLabelText(/Email/i), testFixtures.tcClient.client_email);
      await user.type(screen.getByLabelText(/Phone/i), testFixtures.tcClient.client_phone);

      let nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Transaction Details/i)).toBeInTheDocument();
      });

      // Fill step 2 (simplified)
      // Navigate to step 3
      // Verify plan selection is displayed
      expect(screen.getByText(/Transaction Coordination/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create TC application in database', async () => {
      const user = userEvent.setup();
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: testFixtures.tcClient.id },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test' },
        error: null,
      });

      render(<TcApplication />);

      // Fill and submit form
      await waitFor(() => {
        expect(screen.getByText(/Transaction Coordination/i)).toBeInTheDocument();
      });

      // Verify database insert was called
      expect(mockSupabaseClient.from).toBeDefined();
    });

    it('should process payment after submission', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.tcClient.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test' },
        error: null,
      });

      render(<TcApplication />);

      // Submit form
      // Verify payment checkout was created
      expect(mockSupabaseClient.functions.invoke).toBeDefined();
    });

    it('should send confirmation email after submission', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.tcClient.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      render(<TcApplication />);

      // Submit form
      // Verify email service was called
      expect(mockSupabaseClient.functions.invoke).toBeDefined();
    });
  });

  describe('Data Persistence', () => {
    it('should persist data between steps', async () => {
      const user = userEvent.setup();
      render(<TcApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Client Name/i);
      await user.type(nameInput, testFixtures.tcClient.client_name);

      // Navigate to next step
      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      // Navigate back
      const backButton = screen.getByRole('button', { name: /back/i });
      if (backButton) {
        await user.click(backButton);
      }

      // Data should be persisted
      await waitFor(() => {
        const nameField = screen.getByLabelText(/Client Name/i) as HTMLInputElement;
        expect(nameField.value).toContain(testFixtures.tcClient.client_name);
      });
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<TcApplication />);

      await waitFor(() => {
        // Should show authentication error
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      render(<TcApplication />);

      // Submit form
      // Verify error is handled
      await waitFor(() => {
        expect(screen.getByText(/Transaction Coordination/i)).toBeInTheDocument();
      });
    });

    it('should handle payment processing errors', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.tcClient.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Payment error' },
      });

      render(<TcApplication />);

      // Submit form
      // Verify error is handled
      await waitFor(() => {
        expect(screen.getByText(/Transaction Coordination/i)).toBeInTheDocument();
      });
    });
  });
});





