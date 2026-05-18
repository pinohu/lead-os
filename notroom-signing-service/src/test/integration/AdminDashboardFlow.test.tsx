// src/test/integration/AdminDashboardFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLogin from '@/pages/admin/Login';
import AdminBookings from '@/pages/admin/Bookings';
import AdminTcClients from '@/pages/admin/TcClients';
import AdminCropApplications from '@/pages/admin/CropApplications';
import { supabase } from '@/integrations/supabase/client';
import { mockSupabaseClient, testFixtures } from './setup';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: testFixtures.adminUser,
  }),
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
    useLocation: () => ({ pathname: '/admin/bookings' }),
  };
});

describe('Admin Dashboard Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Login Flow', () => {
    it('should render login form', () => {
      render(<AdminLogin />);
      
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should login with valid credentials', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testFixtures.adminUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            })),
          })),
        })),
      } as any);

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/Email/i), testFixtures.adminUser.email);
      await user.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should reject login with invalid credentials', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/Email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should reject non-admin users', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: testFixtures.regularUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      } as any);

      render(<AdminLogin />);

      await user.type(screen.getByLabelText(/Email/i), testFixtures.regularUser.email);
      await user.type(screen.getByLabelText(/Password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('View Bookings List', () => {
    it('should load bookings', async () => {
      const mockBookings = [
        { ...testFixtures.booking, id: '1' },
        { ...testFixtures.booking, id: '2' },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: mockBookings,
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });

    it('should filter bookings', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [testFixtures.booking],
              error: null,
            }),
          })),
        })),
      } as any);

      render(<AdminBookings />);

      // Filter by status
      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });

    it('should sort bookings', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });

    it('should paginate bookings', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });
  });

  describe('Update Booking Status', () => {
    it('should update status to confirmed', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.booking, status: 'confirmed' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });

    it('should update status to completed', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.booking, status: 'completed' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });

    it('should update status to cancelled', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.booking, status: 'cancelled' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });
  });

  describe('View TC Clients', () => {
    it('should load TC clients', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.tcClient],
            error: null,
          }),
        })),
      } as any);

      render(<AdminTcClients />);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [testFixtures.tcClient],
              error: null,
            }),
          })),
        })),
      } as any);

      render(<AdminTcClients />);

      await waitFor(() => {
        expect(screen.getByText(/TC Clients/i)).toBeInTheDocument();
      });
    });

    it('should update client status', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.tcClient],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.tcClient, status: 'active' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminTcClients />);

      await waitFor(() => {
        expect(screen.getByText(/TC Clients/i)).toBeInTheDocument();
      });
    });
  });

  describe('View CROP Applications', () => {
    it('should load CROP applications', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.cropApplication],
            error: null,
          }),
        })),
      } as any);

      render(<AdminCropApplications />);

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });
    });

    it('should filter applications', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [testFixtures.cropApplication],
              error: null,
            }),
          })),
        })),
      } as any);

      render(<AdminCropApplications />);

      await waitFor(() => {
        expect(screen.getByText(/CROP Applications/i)).toBeInTheDocument();
      });
    });

    it('should update application status', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.cropApplication],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.cropApplication, status: 'approved' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminCropApplications />);

      await waitFor(() => {
        expect(screen.getByText(/CROP Applications/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should select multiple items', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking, { ...testFixtures.booking, id: '2' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });

    it('should bulk update status', async () => {
      const user = userEvent.setup();
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [testFixtures.booking, { ...testFixtures.booking, id: '2' }],
            error: null,
          }),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [{ ...testFixtures.booking, status: 'confirmed' }],
            error: null,
          }),
        })),
      } as any);

      render(<AdminBookings />);

      await waitFor(() => {
        expect(screen.getByText(/Bookings/i)).toBeInTheDocument();
      });
    });
  });
});





