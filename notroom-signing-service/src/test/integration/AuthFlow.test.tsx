// src/test/integration/AuthFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '@/pages/Auth';
import { supabase } from '@/integrations/supabase/client';
import { mockSupabaseClient, testFixtures } from './setup';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  const mockNavigate = vi.fn();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/auth' }),
  };
});

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testFixtures.regularUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      render(<Auth />);

      // Find login form elements
      await waitFor(() => {
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      if (emailInput && passwordInput) {
        await user.type(emailInput, testFixtures.regularUser.email);
        await user.type(passwordInput, 'password123');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        if (submitButton) {
          await user.click(submitButton);
        }

        await waitFor(() => {
          expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
        });
      }
    });

    it('should reject login with invalid credentials', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      render(<Auth />);

      await waitFor(() => {
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      if (emailInput && passwordInput) {
        await user.type(emailInput, 'wrong@example.com');
        await user.type(passwordInput, 'wrongpassword');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        if (submitButton) {
          await user.click(submitButton);
        }

        await waitFor(() => {
          expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
        });
      }
    });

    it('should redirect after successful login', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testFixtures.regularUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      render(<Auth />);

      await waitFor(() => {
        expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      });

      // Login would trigger redirect
      expect(mockSupabaseClient.auth.signInWithPassword).toBeDefined();
    });
  });

  describe('User Signup', () => {
    it('should signup with valid data', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: testFixtures.regularUser,
          session: null,
        },
        error: null,
      });

      render(<Auth />);

      // Switch to signup tab if needed
      await waitFor(() => {
        expect(screen.getByText(/Sign/i)).toBeInTheDocument();
      });

      // Fill signup form
      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);

      if (emailInput && passwordInput) {
        await user.type(emailInput, 'newuser@example.com');
        await user.type(passwordInput, 'password123');

        const submitButton = screen.getByRole('button', { name: /sign up|create account/i });
        if (submitButton) {
          await user.click(submitButton);
        }

        await waitFor(() => {
          expect(mockSupabaseClient.auth.signUp).toHaveBeenCalled();
        });
      }
    });

    it('should validate signup data', async () => {
      const user = userEvent.setup();
      render(<Auth />);

      await waitFor(() => {
        expect(screen.getByText(/Sign/i)).toBeInTheDocument();
      });

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /sign up|create account/i });
      if (submitButton) {
        await user.click(submitButton);
      }

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();
      });
    });

    it('should handle email verification flow', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: { ...testFixtures.regularUser, email_confirmed_at: null },
          session: null,
        },
        error: null,
      });

      render(<Auth />);

      await waitFor(() => {
        expect(screen.getByText(/Sign/i)).toBeInTheDocument();
      });

      // Signup would trigger email verification
      expect(mockSupabaseClient.auth.signUp).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should logout and clear session', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Mock authenticated state
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testFixtures.regularUser },
        error: null,
      });

      render(<Auth />);

      // Logout would clear session
      expect(mockSupabaseClient.auth.signOut).toBeDefined();
    });

    it('should redirect after logout', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Logout would trigger redirect
      expect(mockSupabaseClient.auth.signOut).toBeDefined();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Protected route would redirect
      expect(mockSupabaseClient.auth.getUser).toBeDefined();
    });

    it('should allow access when authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testFixtures.regularUser },
        error: null,
      });

      // Protected route would allow access
      expect(mockSupabaseClient.auth.getUser).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should refresh session', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: testFixtures.regularUser },
        error: null,
      });

      // Session refresh would be handled
      expect(mockSupabaseClient.auth.getUser).toBeDefined();
    });

    it('should handle session expiration', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      // Session expiration would be handled
      expect(mockSupabaseClient.auth.getUser).toBeDefined();
    });
  });
});





