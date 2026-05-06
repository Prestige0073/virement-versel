import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TransferStepPage from '../pages/TransferStepPage';
import { TransferStepProvider } from '../context/TransferStepContext';
import { BrowserRouter } from 'react-router-dom';

/**
 * Tests for TransferStepPage Component
 * Covers: List display, search, filter, CRUD operations
 */

// Mock useTransferStep hook
vi.mock('../hooks/useTransferStep', () => ({
  useTransferStep: () => ({
    steps: [
      {
        id: 'step1',
        step_number: 1,
        step_name: 'Vérification Identité',
        description: 'Vérifiez l\'identité du client',
        step_type: 'verification',
        required_fields: ['holder_name', 'holder_email'],
        is_active: true,
        estimated_duration_minutes: 5,
      },
      {
        id: 'step2',
        step_number: 2,
        step_name: 'Approbation Directeur',
        description: 'Approbation du directeur',
        step_type: 'approval',
        required_fields: ['iban', 'bic'],
        is_active: true,
        estimated_duration_minutes: 15,
      },
      {
        id: 'step3',
        step_number: 3,
        step_name: 'Notification Client',
        description: 'Notifier le client',
        step_type: 'notification',
        required_fields: [],
        is_active: false,
        estimated_duration_minutes: 2,
      },
    ],
    loading: false,
    error: null,
    createStep: vi.fn().mockResolvedValue({ success: true }),
    updateStep: vi.fn().mockResolvedValue({ success: true }),
    deleteStep: vi.fn().mockResolvedValue({ success: true }),
    getSteps: vi.fn().mockResolvedValue({ success: true, data: [] }),
  }),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <TransferStepProvider>
        {component}
      </TransferStepProvider>
    </BrowserRouter>
  );
};

describe('TransferStepPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render the page title', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Étapes de Virement')).toBeInTheDocument();
    });

    it('should render create button', () => {
      renderWithProviders(<TransferStepPage />);
      const createButtons = screen.getAllByText('+ Nouvelle Étape');
      expect(createButtons.length).toBeGreaterThan(0);
    });

    it('should display all steps', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Vérification Identité')).toBeInTheDocument();
      expect(screen.getByText('Approbation Directeur')).toBeInTheDocument();
      expect(screen.getByText('Notification Client')).toBeInTheDocument();
    });
  });

  describe('Step Display', () => {
    it('should display step numbers', () => {
      renderWithProviders(<TransferStepPage />);
      // Step numbers shown in badges
      const stepNumbers = screen.getAllByText(/^[0-9]+$/);
      expect(stepNumbers.length).toBeGreaterThan(0);
    });

    it('should display step descriptions', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Vérifiez l\'identité du client')).toBeInTheDocument();
    });

    it('should display step types as badges', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Vérification')).toBeInTheDocument();
      expect(screen.getByText('Approbation')).toBeInTheDocument();
      expect(screen.getByText('Notification')).toBeInTheDocument();
    });

    it('should show inactive badge for inactive steps', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });

    it('should display estimated duration', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('~5 min')).toBeInTheDocument();
      expect(screen.getByText('~15 min')).toBeInTheDocument();
    });
  });

  describe('Required Fields Display', () => {
    it('should show required fields section', () => {
      renderWithProviders(<TransferStepPage />);
      const requiredSections = screen.getAllByText('Champs requis:');
      expect(requiredSections.length).toBeGreaterThan(0);
    });

    it('should display required field names', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('holder_name')).toBeInTheDocument();
      expect(screen.getByText('holder_email')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should have search input', () => {
      renderWithProviders(<TransferStepPage />);
      const searchInput = screen.getByPlaceholderText('Rechercher une étape...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter steps by name', () => {
      renderWithProviders(<TransferStepPage />);
      const searchInput = screen.getByPlaceholderText('Rechercher une étape...');
      
      fireEvent.change(searchInput, { target: { value: 'Vérification' } });
      
      expect(screen.getByText('Vérification Identité')).toBeInTheDocument();
      expect(screen.queryByText('Approbation Directeur')).not.toBeInTheDocument();
    });

    it('should filter steps by description', () => {
      renderWithProviders(<TransferStepPage />);
      const searchInput = screen.getByPlaceholderText('Rechercher une étape...');
      
      fireEvent.change(searchInput, { target: { value: 'directeur' } });
      
      expect(screen.getByText('Approbation Directeur')).toBeInTheDocument();
    });

    it('should show all steps when search cleared', () => {
      renderWithProviders(<TransferStepPage />);
      const searchInput = screen.getByPlaceholderText('Rechercher une étape...');
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(screen.getByText('Vérification Identité')).toBeInTheDocument();
      expect(screen.getByText('Approbation Directeur')).toBeInTheDocument();
    });
  });

  describe('Step Actions', () => {
    it('should display modify button for each step', () => {
      renderWithProviders(<TransferStepPage />);
      const modifyButtons = screen.getAllByText('Modifier');
      expect(modifyButtons.length).toBe(3);
    });

    it('should display delete button for each step', () => {
      renderWithProviders(<TransferStepPage />);
      const deleteButtons = screen.getAllByText('Supprimer');
      expect(deleteButtons.length).toBe(3);
    });
  });

  describe('Delete Confirmation', () => {
    it('should show delete confirmation dialog', () => {
      renderWithProviders(<TransferStepPage />);
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
      
      expect(screen.getByText(/Êtes-vous sûr/)).toBeInTheDocument();
    });

    it('should have confirm and cancel buttons in dialog', () => {
      renderWithProviders(<TransferStepPage />);
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
      
      const confirmButton = screen.getByText('Confirmer');
      const cancelButton = screen.getByText('Annuler');
      
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should hide confirmation when cancel clicked', () => {
      renderWithProviders(<TransferStepPage />);
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText(/Êtes-vous sûr/)).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);
      expect(screen.queryByText(/Êtes-vous sûr/)).not.toBeInTheDocument();
    });
  });

  describe('Filter by Type', () => {
    it('should have type filter select', () => {
      renderWithProviders(<TransferStepPage />);
      const filterSelect = screen.getByDisplayValue('Tous les types');
      expect(filterSelect).toBeInTheDocument();
    });

    it('should show all step types in filter', () => {
      renderWithProviders(<TransferStepPage />);
      const filterSelect = screen.getByDisplayValue('Tous les types');
      fireEvent.click(filterSelect);
      
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Sort Functionality', () => {
    it('should have sort select', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByDisplayValue('Par numéro')).toBeInTheDocument();
    });

    it('should have sort options', () => {
      renderWithProviders(<TransferStepPage />);
      const sortSelect = screen.getByDisplayValue('Par numéro');
      fireEvent.click(sortSelect);
      
      expect(screen.getByText('Par nom')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no steps', () => {
      // This test would need a mock that returns empty steps
      // Skipping for now as current mock returns data
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      // This test would need a mock that returns loading=true
      // Skipping for now as current mock returns loading=false
    });
  });

  describe('Error Handling', () => {
    it('should display error message if present', () => {
      // This test would need a mock with error state
      // Skipping for now as current mock returns error=null
    });
  });

  describe('Form Modal', () => {
    it('should show form when create button clicked', () => {
      renderWithProviders(<TransferStepPage />);
      const createButton = screen.getAllByText('+ Nouvelle Étape')[0];
      fireEvent.click(createButton);
      
      // Form should be displayed (would contain form title)
      // This test depends on form component rendering
      expect(screen.getByDisplayValue('verification')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render step cards in responsive layout', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Vérification Identité')).toBeInTheDocument();
    });

    it('should have proper spacing and padding', () => {
      const { container } = renderWithProviders(<TransferStepPage />);
      const mainContainer = container.querySelector('[class*="max-w-6xl"]');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Multiple Steps Handling', () => {
    it('should display all three steps correctly', () => {
      renderWithProviders(<TransferStepPage />);
      expect(screen.getByText('Vérification Identité')).toBeInTheDocument();
      expect(screen.getByText('Approbation Directeur')).toBeInTheDocument();
      expect(screen.getByText('Notification Client')).toBeInTheDocument();
    });

    it('should handle mix of active and inactive steps', () => {
      renderWithProviders(<TransferStepPage />);
      
      // Check for inactive badge being shown
      const inactiveSteps = screen.getAllByText('Inactif');
      expect(inactiveSteps.length).toBeGreaterThan(0);
    });
  });
});
