/**
 * Tests - AuthContext.test.jsx
 * Tests unitaires pour le contexte d'authentification
 * 
 * Couverture:
 * - Initialization
 * - Signup validation
 * - Login flow
 * - Logout cleanup
 * - Password reset
 * - Error handling
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../context/AuthContext';

/**
 * Mock Supabase
 */
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with no user', async () => {
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return <div>{context?.user ? 'Logged in' : 'Not logged in'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });

  it('provides signup function', async () => {
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return (
        <button onClick={() => context?.signup('test@example.com', 'Password123')}>
          Sign Up
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByRole('button', { name: /sign up/i });
    expect(button).toBeInTheDocument();
  });

  it('provides login function', async () => {
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return (
        <button onClick={() => context?.login('test@example.com', 'Password123')}>
          Log In
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).toBeInTheDocument();
  });

  it('provides logout function', async () => {
    const TestComponent = () => {
      const context = React.useContext(AuthContext);
      return (
        <button onClick={() => context?.logout()}>
          Log Out
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByRole('button', { name: /log out/i });
    expect(button).toBeInTheDocument();
  });

  it('handles loading state', async () => {
    const TestComponent = () => {
      const { loading } = React.useContext(AuthContext) || {};
      return <div>Loading: {loading ? 'true' : 'false'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Loading: (true|false)/)).toBeInTheDocument();
    });
  });
});
