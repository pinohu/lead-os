// src/test/integration/setup.ts
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Supabase client for integration tests
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  },
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
};

// Test fixtures
export const testFixtures = {
  booking: {
    id: 'test-booking-id',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '8144800989',
    service: 'ron',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  tcClient: {
    id: 'test-tc-id',
    client_name: 'Jane Smith',
    client_email: 'jane@example.com',
    client_phone: '8144800989',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  cropApplication: {
    id: 'test-crop-id',
    entity_name: 'Test Entity LLC',
    entity_type: 'llc',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  adminUser: {
    id: 'admin-user-id',
    email: 'admin@notroom.com',
    role: 'admin',
  },
  regularUser: {
    id: 'regular-user-id',
    email: 'user@example.com',
    role: 'user',
  },
};

// Cleanup function for test data
export async function cleanupTestData() {
  // In a real integration test environment, this would clean up test database
  // For now, we'll just reset mocks
  vi.clearAllMocks();
}

// Setup and teardown hooks
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock external services
export const mockExternalServices = {
  email: {
    send: vi.fn(() => Promise.resolve({ success: true })),
  },
  sms: {
    send: vi.fn(() => Promise.resolve({ success: true })),
  },
  payment: {
    createCheckout: vi.fn(() => Promise.resolve({ url: 'https://checkout.stripe.com/test' })),
  },
  captcha: {
    verify: vi.fn(() => Promise.resolve({ success: true })),
  },
};





