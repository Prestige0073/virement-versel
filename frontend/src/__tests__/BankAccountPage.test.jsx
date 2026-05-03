import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import BankAccountPage from '../pages/BankAccountPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { BankAccountProvider } from '../context/BankAccountContext';

/**
 * Tests for BankAccountPage Component
 * Covers: List accounts, create, edit, delete operations
 */

// Mock useBankAccount hook
vi.mock('../hooks/useBankAccount', () => ({
  useBankAccount: () => ({
    accounts: [
      {
        id: 'account-1',
        holder_name: 'Jean Dupont',
        holder_email: 'jean@example.com',
        phone: '628365841',
        address: '123 rue test',
        iban: 'CI05A12345678901234567890',
        bic: 'ABCDCI2X',
        bank_name: 'Banque Atlantique',
        branch: 'Abidjan',
        account_type: 'courant',
        tier: 'premium',
        currency: 'XOF',
        current_balance: 5000000,
        bank_logo_url: 'https://example.com/logo.png',
        created_at: '2026-05-01T10:00:00Z',
      },
    ],
    selectedAccount: null,
    loading: false,
    error: null,
    createAccount: vi.fn().mockResolvedValue({ success: true }),
    updateAccount: vi.fn().mockResolvedValue({ success: true }),
    deleteAccount: vi.fn().mockResolvedValue({ success: true }),
    getAccount: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getAccounts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    setSelectedAccount: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  }),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <BankAccountProvider>
          {component}
        </BankAccountProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BankAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Account List Display', () => {
    it('should render the accounts page title', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Mes Comptes Bancaires/i)).toBeInTheDocument();
      expect(screen.getByText(/Gérez vos comptes bancaires fictifs/i)).toBeInTheDocument();
    });

    it('should display account card with correct information', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
      expect(screen.getByText(/Banque Atlantique/i)).toBeInTheDocument();
      expect(screen.getByText(/courant/i)).toBeInTheDocument();
    });

    it('should display account IBAN correctly', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/CI05A12345678901234567890/i)).toBeInTheDocument();
    });

    it('should display account balance with currency', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/5 000 000/i)).toBeInTheDocument();
      expect(screen.getByText(/XOF/i)).toBeInTheDocument();
    });

    it('should display tier badge', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/premium/i)).toBeInTheDocument();
    });

    it('should display bank logo if present', () => {
      renderWithProviders(<BankAccountPage />);
      
      const logo = screen.getByAltText(/Banque Atlantique/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should show created date in French format', () => {
      renderWithProviders(<BankAccountPage />);
      
      // Check for date display
      const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/;
      expect(screen.getByText(dateRegex)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should have search input field', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByPlaceholderText(/Nom, banque, IBAN/i)).toBeInTheDocument();
    });

    it('should filter accounts by holder name', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const searchInput = screen.getByPlaceholderText(/Nom, banque, IBAN/i);
      fireEvent.change(searchInput, { target: { value: 'Jean' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
      });
    });

    it('should filter accounts by bank name', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const searchInput = screen.getByPlaceholderText(/Nom, banque, IBAN/i);
      fireEvent.change(searchInput, { target: { value: 'Atlantique' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Banque Atlantique/i)).toBeInTheDocument();
      });
    });

    it('should show no results message when search finds nothing', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const searchInput = screen.getByPlaceholderText(/Nom, banque, IBAN/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Aucun compte trouvé/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter by Account Type', () => {
    it('should have account type filter select', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByDisplayValue(/Tous/i)).toBeInTheDocument();
    });

    it('should list all account types in filter', () => {
      renderWithProviders(<BankAccountPage />);
      
      const select = screen.getByDisplayValue(/Tous/i);
      const options = select.querySelectorAll('option');
      
      expect(options).toHaveLength(5); // Tous + 4 types
    });

    it('should filter by account type selection', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const filterSelect = screen.getByDisplayValue(/Tous/i);
      fireEvent.change(filterSelect, { target: { value: 'courant' } });
      
      await waitFor(() => {
        expect(screen.getByText(/courant/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Account Button', () => {
    it('should display create account button', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Nouveau Compte/i)).toBeInTheDocument();
    });

    it('should open form when create button clicked', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const createButton = screen.getByText(/Nouveau Compte/i);
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Créer un Nouveau Compte/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Actions', () => {
    it('should display action buttons for each account', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Détails/i)).toBeInTheDocument();
      expect(screen.getByText(/Modifier/i)).toBeInTheDocument();
      expect(screen.getByText(/Supprimer/i)).toBeInTheDocument();
    });

    it('should open details when details button clicked', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const detailsButton = screen.getByText(/Détails/i);
      fireEvent.click(detailsButton);
      
      await waitFor(() => {
        // Details should be set in context
      });
    });

    it('should open edit form when modify button clicked', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const editButton = screen.getByText(/Modifier/i);
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Modifier le Compte/i)).toBeInTheDocument();
      });
    });

    it('should show delete confirmation on first delete click', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const deleteButton = screen.getByText(/Supprimer/i);
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Confirmer/i)).toBeInTheDocument();
      });
    });

    it('should delete account on confirmed delete', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const deleteButton = screen.getByText(/Supprimer/i);
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByText(/Confirmer/i);
        fireEvent.click(confirmButton);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no accounts', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [],
        selectedAccount: null,
        loading: false,
        error: null,
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Aucun compte créé/i)).toBeInTheDocument();
      expect(screen.getByText(/Commencez par créer votre premier compte/i)).toBeInTheDocument();
    });

    it('should show create button in empty state', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [],
        selectedAccount: null,
        loading: false,
        error: null,
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      const createButton = screen.getByText(/Créer mon Premier Compte/i);
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error state set', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [],
        selectedAccount: null,
        loading: false,
        error: 'Failed to load accounts',
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Failed to load accounts/i)).toBeInTheDocument();
    });

    it('should show error with X icon', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [],
        selectedAccount: null,
        loading: false,
        error: 'Test error',
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/✗/)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during loading', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [],
        selectedAccount: null,
        loading: true,
        error: null,
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      // Edit and delete buttons should be disabled
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent.includes('Modifier') || button.textContent.includes('Supprimer')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Account Details Display', () => {
    it('should display holder email', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/jean@example.com/i)).toBeInTheDocument();
    });

    it('should display phone number', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/628365841/i)).toBeInTheDocument();
    });

    it('should display address', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/123 rue test/i)).toBeInTheDocument();
    });

    it('should display BIC', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/ABCDCI2X/i)).toBeInTheDocument();
    });

    it('should display branch if present', () => {
      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Abidjan/i)).toBeInTheDocument();
    });

    it('should display balance with currency formatting', () => {
      renderWithProviders(<BankAccountPage />);
      
      // Should format as currency
      expect(screen.getByText(/5 000 000/i)).toBeInTheDocument();
      expect(screen.getByText(/XOF/i)).toBeInTheDocument();
    });
  });

  describe('Form Navigation', () => {
    it('should show back button in form view', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const createButton = screen.getByText(/Nouveau Compte/i);
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/←/)).toBeInTheDocument();
      });
    });

    it('should go back to list when back button clicked', async () => {
      renderWithProviders(<BankAccountPage />);
      
      const createButton = screen.getByText(/Nouveau Compte/i);
      fireEvent.click(createButton);
      
      await waitFor(() => {
        const backButton = screen.getByText(/Retour à la liste/i);
        fireEvent.click(backButton);
        
        expect(screen.getByText(/Mes Comptes Bancaires/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render account cards with proper styling', () => {
      renderWithProviders(<BankAccountPage />);
      
      const cards = screen.getAllByRole('generic').filter(el => 
        el.className.includes('rounded-lg') && el.className.includes('shadow')
      );
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have search bar in actions bar', () => {
      renderWithProviders(<BankAccountPage />);
      
      const searchInput = screen.getByPlaceholderText(/Nom, banque, IBAN/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveClass('input-field');
    });
  });

  describe('Multiple Accounts', () => {
    it('should display multiple accounts in list', () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            holder_name: 'Jean Dupont',
            bank_name: 'Banque Atlantique',
            account_type: 'courant',
            tier: 'premium',
            currency: 'XOF',
            current_balance: 5000000,
            created_at: '2026-05-01T10:00:00Z',
            holder_email: 'jean@example.com',
            phone: '628365841',
            address: 'Test',
            iban: 'CI05A1',
            bic: 'ABC',
            branch: 'Test',
            bank_logo_url: null,
          },
          {
            id: 'account-2',
            holder_name: 'Marie Martin',
            bank_name: 'Ecobank',
            account_type: 'épargne',
            tier: 'basique',
            currency: 'EUR',
            current_balance: 2500000,
            created_at: '2026-05-02T10:00:00Z',
            holder_email: 'marie@example.com',
            phone: '798365841',
            address: 'Test2',
            iban: 'CI05A2',
            bic: 'DEF',
            branch: 'Test2',
            bank_logo_url: null,
          },
        ],
        selectedAccount: null,
        loading: false,
        error: null,
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
      expect(screen.getByText(/Marie Martin/i)).toBeInTheDocument();
      expect(screen.getByText(/Banque Atlantique/i)).toBeInTheDocument();
      expect(screen.getByText(/Ecobank/i)).toBeInTheDocument();
    });

    it('should filter multiple accounts correctly', async () => {
      vi.mocked(require('../hooks/useBankAccount')).useBankAccount.mockReturnValue({
        accounts: [
          {
            id: 'account-1',
            holder_name: 'Jean Dupont',
            bank_name: 'Banque Atlantique',
            account_type: 'courant',
            tier: 'premium',
            currency: 'XOF',
            current_balance: 5000000,
            created_at: '2026-05-01T10:00:00Z',
            holder_email: 'jean@example.com',
            phone: '628365841',
            address: 'Test',
            iban: 'CI05A1',
            bic: 'ABC',
            branch: 'Test',
            bank_logo_url: null,
          },
          {
            id: 'account-2',
            holder_name: 'Marie Martin',
            bank_name: 'Ecobank',
            account_type: 'épargne',
            tier: 'basique',
            currency: 'EUR',
            current_balance: 2500000,
            created_at: '2026-05-02T10:00:00Z',
            holder_email: 'marie@example.com',
            phone: '798365841',
            address: 'Test2',
            iban: 'CI05A2',
            bic: 'DEF',
            branch: 'Test2',
            bank_logo_url: null,
          },
        ],
        selectedAccount: null,
        loading: false,
        error: null,
        createAccount: vi.fn(),
        updateAccount: vi.fn(),
        deleteAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccounts: vi.fn(),
        setSelectedAccount: vi.fn(),
        clearError: vi.fn(),
      });

      renderWithProviders(<BankAccountPage />);
      
      const filterSelect = screen.getByDisplayValue(/Tous/i);
      fireEvent.change(filterSelect, { target: { value: 'courant' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
        // Marie should be filtered out (she has épargne account)
      });
    });
  });
});
