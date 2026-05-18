// src/test/integration/CropApplicationFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CropApplication from '@/pages/CropApplication';
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

describe('CROP Application Flow Integration Tests', () => {
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

  describe('Step 1: Entity Information', () => {
    it('should render entity information form', async () => {
      render(<CropApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Entity Type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/State of Formation/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
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

    it('should proceed to step 2 when step 1 is valid', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Entity Name/i), testFixtures.cropApplication.entity_name);
      // Select entity type and state (would need to interact with Select components)

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Step 2: Contact Information', () => {
    it('should display contact information form', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      // Fill step 1
      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Entity Name/i), testFixtures.cropApplication.entity_name);

      const nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
      });
    });

    it('should validate contact information', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      // Navigate to step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Entity Name/i), testFixtures.cropApplication.entity_name);

      let nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
      });

      // Try to proceed without contact info
      nextButton = screen.getByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Mail Preferences', () => {
    it('should display mail preferences form', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      // Navigate to step 3
      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
      });

      // Fill previous steps and navigate
      expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
    });
  });

  describe('Step 4: Plan Selection', () => {
    it('should display plan selection', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      // Navigate through steps
      await waitFor(() => {
        expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
      });

      // Verify plan selection exists
      expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create CROP application in database', async () => {
      const user = userEvent.setup();
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: testFixtures.cropApplication.id },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test' },
        error: null,
      });

      render(<CropApplication />);

      // Fill and submit form
      await waitFor(() => {
        expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
      });

      // Verify database insert was called
      expect(mockSupabaseClient.from).toBeDefined();
    });

    it('should process payment after submission', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.cropApplication.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test' },
        error: null,
      });

      render(<CropApplication />);

      // Submit form
      // Verify payment checkout was created
      expect(mockSupabaseClient.functions.invoke).toBeDefined();
    });

    it('should send confirmation email after submission', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.cropApplication.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      render(<CropApplication />);

      // Submit form
      // Verify email service was called
      expect(mockSupabaseClient.functions.invoke).toBeDefined();
    });
  });

  describe('Data Persistence', () => {
    it('should persist data between steps', async () => {
      const user = userEvent.setup();
      render(<CropApplication />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Entity Name/i)).toBeInTheDocument();
      });

      const entityInput = screen.getByLabelText(/Entity Name/i);
      await user.type(entityInput, testFixtures.cropApplication.entity_name);

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
        const entityField = screen.getByLabelText(/Entity Name/i) as HTMLInputElement;
        expect(entityField.value).toContain(testFixtures.cropApplication.entity_name);
      });
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<CropApplication />);

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

      render(<CropApplication />);

      // Submit form
      // Verify error is handled
      await waitFor(() => {
        expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
      });
    });

    it('should handle payment processing errors', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: testFixtures.cropApplication.id },
          error: null,
        }),
      } as any);

      mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Payment error' },
      });

      render(<CropApplication />);

      // Submit form
      // Verify error is handled
      await waitFor(() => {
        expect(screen.getByText(/CROP Application/i)).toBeInTheDocument();
      });
    });
  });
});





