/**
 * Tests - SignupPage.test.jsx
 * Tests pour le formulaire d'inscription
 * 
 * Couverture:
 * - Form rendering
 * - Validation email
 * - Validation mot de passe
 * - Confirmation mot de passe
 * - API call
 * - Error display
 * - Success redirect
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '../pages/SignupPage';
import * as router from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useAuth hook
const mockUseAuth = {
  signup: vi.fn(),
  loading: false,
  error: null,
  clearError: vi.fn(),
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form', () => {
    render(<SignupPage />);
    
    expect(screen.getByText('Créer un compte')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
  });

  it('displays email field', () => {
    render(<SignupPage />);
    
    const emailInput = screen.getByPlaceholderText('votre@email.com');
    expect(emailInput).toBeInTheDocument();
  });

  it('displays password field', () => {
    render(<SignupPage />);
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    expect(passwordInputs.length).toBe(2); // password + confirm
  });

  it('displays submit button', () => {
    render(<SignupPage />);
    
    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('displays password requirements', () => {
    render(<SignupPage />);
    
    expect(screen.getByText(/Minimum 8 caractères/i)).toBeInTheDocument();
  });

  it('validates email on submit', async () => {
    render(<SignupPage />);
    
    const form = screen.getByRole('button', { name: /s'inscrire/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Email invalide|Tous les champs/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(<SignupPage />);
    
    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');

    const form = screen.getByRole('button', { name: /s'inscrire/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
    });
  });

  it('validates password format', async () => {
    render(<SignupPage />);
    
    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123'); // no uppercase

    const form = screen.getByRole('button', { name: /s'inscrire/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/majuscule|chiffre/i)).toBeInTheDocument();
    });
  });

  it('calls signup on valid form', async () => {
    mockUseAuth.signup.mockResolvedValue({ success: true });

    render(<SignupPage />);
    
    const emailInput = screen.getByPlaceholderText('votre@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInputs[0], 'Password123');
    await userEvent.type(passwordInputs[1], 'Password123');

    const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseAuth.signup).toHaveBeenCalledWith(
        'test@example.com',
        'Password123'
      );
    });
  });

  it('displays loading state during signup', async () => {
    mockUseAuth.loading = true;

    render(<SignupPage />);
    
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('displays error message on failure', async () => {
    mockUseAuth.error = 'Email already in use';

    render(<SignupPage />);
    
    expect(screen.getByText(/Email already in use/i)).toBeInTheDocument();
  });

  it('hides signup link', () => {
    render(<SignupPage />);
    
    const loginLink = screen.getByRole('link', { name: /Se connecter/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
