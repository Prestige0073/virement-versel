import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TransferAttemptsPage from '../pages/TransferAttemptsPage';
import { TransferAttemptProvider } from '../context/TransferAttemptContext';
import '@testing-library/jest-dom';

// Mock the custom hook
jest.mock('../hooks/useTransferAttempt', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useTransferAttempt from '../hooks/useTransferAttempt';

const renderComponent = (mockContextValue = {}) => {
  const defaultContextValue = {
    attempts: [],
    selectedAttempt: null,
    loading: false,
    error: null,
    startAttempt: jest.fn(),
    advanceStep: jest.fn(),
    skipStep: jest.fn(),
    failStep: jest.fn(),
    getAttempt: jest.fn(),
    getAttempts: jest.fn(() => Promise.resolve([])),
    clearError: jest.fn(),
    ...mockContextValue,
  };

  useTransferAttempt.mockReturnValue(defaultContextValue);

  return render(
    <BrowserRouter>
      <TransferAttemptsPage />
    </BrowserRouter>
  );
};

describe('TransferAttemptsPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Page Rendering Tests ====================
  describe('Page Rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText(/Suivi des Virements/i)).toBeInTheDocument();
    });

    test('should render search input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText(/Chercher par référence/i)).toBeInTheDocument();
    });

    test('should render status filter dropdown', () => {
      renderComponent();
      expect(screen.getByDisplayValue(/Tous les statuts/i)).toBeInTheDocument();
    });

    test('should render sort options dropdown', () => {
      renderComponent();
      const sortSelect = screen.getByDisplayValue(/Date de création/i);
      expect(sortSelect).toBeInTheDocument();
    });

    test('should render empty state message when no attempts', async () => {
      renderComponent({ attempts: [] });
      await waitFor(() => {
        expect(screen.getByText(/Aucun virement en cours/i)).toBeInTheDocument();
      });
    });

    test('should render loading spinner when loading', () => {
      renderComponent({ loading: true });
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should render error message when error exists', async () => {
      renderComponent({ error: 'Erreur de chargement' });
      await waitFor(() => {
        expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument();
      });
    });

    test('should render error dismiss button', () => {
      renderComponent({ error: 'Test error' });
      const dismissButton = screen.getByRole('button', { name: /Fermer/i });
      expect(dismissButton).toBeInTheDocument();
    });

    test('should have responsive grid layout', () => {
      const mockAttempts = [
        {
          id: '1',
          reference: 'REF001',
          amount: 1500,
          status: 'in-progress',
          currentStepNumber: 2,
          totalSteps: 5,
          createdAt: new Date().toISOString(),
        },
      ];
      renderComponent({ attempts: mockAttempts });
      const grid = screen.getByRole('main').querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  // ==================== Attempt List Display Tests ====================
  describe('Attempt List Display', () => {
    const mockAttempts = [
      {
        id: '1',
        reference: 'REF001',
        amount: 1500,
        recipientName: 'Jean Dupont',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
        createdAt: new Date(2026, 4, 1).toISOString(),
        steps: [],
      },
      {
        id: '2',
        reference: 'REF002',
        amount: 2500,
        recipientName: 'Marie Martin',
        status: 'completed',
        currentStepNumber: 5,
        totalSteps: 5,
        createdAt: new Date(2026, 4, 2).toISOString(),
        steps: [],
      },
    ];

    test('should display all attempt cards', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText('REF001')).toBeInTheDocument();
      expect(screen.getByText('REF002')).toBeInTheDocument();
    });

    test('should display attempt amounts', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText(/1 500,00 €/)).toBeInTheDocument();
      expect(screen.getByText(/2 500,00 €/)).toBeInTheDocument();
    });

    test('should display recipient names', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });

    test('should display correct status badges', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText(/En cours/i)).toBeInTheDocument();
      expect(screen.getByText(/Complété/i)).toBeInTheDocument();
    });

    test('should display status badge with correct color class', () => {
      renderComponent({ attempts: mockAttempts });
      const inProgressBadge = screen.getByText(/En cours/i);
      expect(inProgressBadge.parentElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    test('should display progress bar with correct percentage', () => {
      renderComponent({ attempts: mockAttempts });
      const progressBar = screen.getAllByRole('progressbar')[0];
      expect(progressBar).toHaveAttribute('aria-valuenow', '40'); // 2/5 = 40%
    });

    test('should display creation timestamp', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText(/1 mai 2026/i)).toBeInTheDocument();
    });

    test('should display estimated completion time', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText(/Estimation.*minutes/i)).toBeInTheDocument();
    });

    test('should display current step indicator', () => {
      renderComponent({ attempts: mockAttempts });
      expect(screen.getByText(/Étape 2 sur 5/i)).toBeInTheDocument();
    });

    test('should display different status badge for failed attempt', () => {
      const failedAttempt = [
        {
          ...mockAttempts[0],
          id: '3',
          status: 'failed',
          statusReason: 'Validation failed',
        },
      ];
      renderComponent({ attempts: failedAttempt });
      const failedBadge = screen.getByText(/Échoué/i);
      expect(failedBadge.parentElement).toHaveClass('bg-red-100', 'text-red-800');
    });

    test('should display on-hold status badge', () => {
      const onHoldAttempt = [
        {
          ...mockAttempts[0],
          id: '4',
          status: 'on-hold',
        },
      ];
      renderComponent({ attempts: onHoldAttempt });
      const onHoldBadge = screen.getByText(/En attente/i);
      expect(onHoldBadge.parentElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  // ==================== Search Functionality Tests ====================
  describe('Search Functionality', () => {
    const mockAttempts = [
      {
        id: '1',
        reference: 'REF001',
        amount: 1500,
        recipientName: 'Jean Dupont',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        reference: 'REF002',
        amount: 2500,
        recipientName: 'Marie Martin',
        status: 'completed',
        currentStepNumber: 5,
        totalSteps: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    test('should filter attempts by reference', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(
        mockAttempts.filter(a => a.reference.includes('REF001'))
      );
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const searchInput = screen.getByPlaceholderText(/Chercher par référence/i);
      await user.type(searchInput, 'REF001');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'REF001' })
        );
      });
    });

    test('should filter attempts by recipient name', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(
        mockAttempts.filter(a => a.recipientName.includes('Jean'))
      );
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const searchInput = screen.getByPlaceholderText(/Chercher par référence/i);
      await user.type(searchInput, 'Jean');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Jean' })
        );
      });
    });

    test('should debounce search input', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(mockAttempts);
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const searchInput = screen.getByPlaceholderText(/Chercher par référence/i);
      await user.type(searchInput, 'REF');

      await waitFor(
        () => {
          expect(getAttemptsMock).toHaveBeenCalledTimes(1);
        },
        { timeout: 600 }
      );
    });

    test('should clear search and show all attempts', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(mockAttempts);
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const searchInput = screen.getByPlaceholderText(/Chercher par référence/i);
      await user.type(searchInput, 'REF001');
      await user.clear(searchInput);

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: '' })
        );
      });
    });
  });

  // ==================== Filtering Tests ====================
  describe('Status Filtering', () => {
    const mockAttempts = [
      {
        id: '1',
        reference: 'REF001',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        reference: 'REF002',
        status: 'completed',
        currentStepNumber: 5,
        totalSteps: 5,
        amount: 2500,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        reference: 'REF003',
        status: 'failed',
        currentStepNumber: 3,
        totalSteps: 5,
        amount: 3000,
        createdAt: new Date().toISOString(),
      },
    ];

    test('should filter attempts by in-progress status', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(
        mockAttempts.filter(a => a.status === 'in-progress')
      );
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const statusSelect = screen.getByDisplayValue(/Tous les statuts/i);
      await user.selectOptions(statusSelect, 'in-progress');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'in-progress' })
        );
      });
    });

    test('should filter attempts by completed status', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(
        mockAttempts.filter(a => a.status === 'completed')
      );
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const statusSelect = screen.getByDisplayValue(/Tous les statuts/i);
      await user.selectOptions(statusSelect, 'completed');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'completed' })
        );
      });
    });

    test('should filter attempts by failed status', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(
        mockAttempts.filter(a => a.status === 'failed')
      );
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const statusSelect = screen.getByDisplayValue(/Tous les statuts/i);
      await user.selectOptions(statusSelect, 'failed');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'failed' })
        );
      });
    });

    test('should show all attempts when filter is reset', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(mockAttempts);
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const statusSelect = screen.getByDisplayValue(/Tous les statuts/i);
      await user.selectOptions(statusSelect, 'completed');
      await user.selectOptions(statusSelect, '');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ status: null })
        );
      });
    });
  });

  // ==================== Sorting Tests ====================
  describe('Sorting', () => {
    const mockAttempts = [
      {
        id: '1',
        reference: 'REF001',
        status: 'in-progress',
        currentStepNumber: 4,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date(2026, 4, 1).toISOString(),
      },
      {
        id: '2',
        reference: 'REF002',
        status: 'completed',
        currentStepNumber: 5,
        totalSteps: 5,
        amount: 2500,
        createdAt: new Date(2026, 4, 3).toISOString(),
      },
    ];

    test('should sort by creation date (newest first)', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue([...mockAttempts].reverse());
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const sortSelect = screen.getByDisplayValue(/Date de création/i);
      await user.selectOptions(sortSelect, 'date');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'date' })
        );
      });
    });

    test('should sort by step number', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue(mockAttempts);
      renderComponent({ attempts: mockAttempts, getAttempts: getAttemptsMock });

      const sortSelect = screen.getByDisplayValue(/Date de création/i);
      await user.selectOptions(sortSelect, 'step');

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'step' })
        );
      });
    });
  });

  // ==================== Step Details Modal Tests ====================
  describe('Step Details Modal', () => {
    const mockAttempt = {
      id: '1',
      reference: 'REF001',
      status: 'in-progress',
      currentStepNumber: 2,
      totalSteps: 5,
      amount: 1500,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step1',
          name: 'Vérification',
          type: 'verification',
          status: 'completed',
          requirements: ['Email valide'],
          validationErrors: [],
        },
        {
          id: 'step2',
          name: 'Approbation',
          type: 'approval',
          status: 'in-progress',
          requirements: ['Confirmation'],
          validationErrors: [],
        },
      ],
    };

    test('should open step details modal when clicking on card', async () => {
      const user = userEvent.setup();
      renderComponent({ attempts: [mockAttempt], selectedAttempt: null });

      const attemptCard = screen.getByText('REF001').closest('div[data-testid="attempt-card"]');
      await user.click(attemptCard);

      await waitFor(() => {
        expect(screen.getByTestId('step-details-modal')).toBeVisible();
      });
    });

    test('should display step information in modal', async () => {
      const user = userEvent.setup();
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const modal = screen.getByTestId('step-details-modal');
      expect(within(modal).getByText('Approbation')).toBeInTheDocument();
    });

    test('should display step requirements', async () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const modal = screen.getByTestId('step-details-modal');
      expect(within(modal).getByText(/Confirmation/i)).toBeInTheDocument();
    });

    test('should display validation errors in modal', async () => {
      const attemptWithErrors = {
        ...mockAttempt,
        steps: [
          {
            ...mockAttempt.steps[1],
            validationErrors: ['Email invalide', 'Téléphone requis'],
          },
        ],
      };
      renderComponent({ attempts: [attemptWithErrors], selectedAttempt: attemptWithErrors });

      const modal = screen.getByTestId('step-details-modal');
      expect(within(modal).getByText('Email invalide')).toBeInTheDocument();
      expect(within(modal).getByText('Téléphone requis')).toBeInTheDocument();
    });

    test('should close modal when clicking close button', async () => {
      const user = userEvent.setup();
      renderComponent({ 
        attempts: [mockAttempt], 
        selectedAttempt: mockAttempt,
        clearError: jest.fn(),
      });

      const closeButton = screen.getByRole('button', { name: /Fermer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('step-details-modal')).not.toBeVisible();
      });
    });

    test('should display step type badge', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const modal = screen.getByTestId('step-details-modal');
      expect(within(modal).getByText(/approval/i)).toBeInTheDocument();
    });
  });

  // ==================== Action Buttons Tests ====================
  describe('Action Buttons', () => {
    const mockAttempt = {
      id: '1',
      reference: 'REF001',
      status: 'in-progress',
      currentStepNumber: 2,
      totalSteps: 5,
      amount: 1500,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step1',
          name: 'Vérification',
          type: 'verification',
          status: 'completed',
          isOptional: false,
        },
        {
          id: 'step2',
          name: 'Approbation',
          type: 'approval',
          status: 'in-progress',
          isOptional: false,
        },
      ],
    };

    test('should display next step button for in-progress step', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const nextButton = screen.getByRole('button', { name: /Étape suivante/i });
      expect(nextButton).toBeInTheDocument();
    });

    test('should call advanceStep when clicking next button', async () => {
      const user = userEvent.setup();
      const advanceStepMock = jest.fn();
      renderComponent({ 
        attempts: [mockAttempt], 
        selectedAttempt: mockAttempt,
        advanceStep: advanceStepMock,
      });

      const nextButton = screen.getByRole('button', { name: /Étape suivante/i });
      await user.click(nextButton);

      expect(advanceStepMock).toHaveBeenCalledWith('1', expect.any(Object));
    });

    test('should display skip button for optional steps', () => {
      const optionalAttempt = {
        ...mockAttempt,
        steps: [
          ...mockAttempt.steps,
          {
            id: 'step3',
            name: 'Notification',
            type: 'notification',
            status: 'pending',
            isOptional: true,
          },
        ],
      };
      renderComponent({ attempts: [optionalAttempt], selectedAttempt: optionalAttempt });

      const skipButton = screen.getByRole('button', { name: /Ignorer/i });
      expect(skipButton).toBeInTheDocument();
    });

    test('should call skipStep when clicking skip button', async () => {
      const user = userEvent.setup();
      const skipStepMock = jest.fn();
      const optionalAttempt = {
        ...mockAttempt,
        steps: [
          ...mockAttempt.steps,
          {
            id: 'step3',
            name: 'Notification',
            type: 'notification',
            status: 'pending',
            isOptional: true,
          },
        ],
      };
      renderComponent({ 
        attempts: [optionalAttempt], 
        selectedAttempt: optionalAttempt,
        skipStep: skipStepMock,
      });

      const skipButton = screen.getByRole('button', { name: /Ignorer/i });
      await user.click(skipButton);

      expect(skipStepMock).toHaveBeenCalledWith('1', 'step3');
    });

    test('should display retry button for failed steps', () => {
      const failedAttempt = {
        ...mockAttempt,
        status: 'failed',
        steps: [
          ...mockAttempt.steps,
          {
            id: 'step2',
            name: 'Approbation',
            type: 'approval',
            status: 'failed',
            failureReason: 'Timeout',
          },
        ],
      };
      renderComponent({ attempts: [failedAttempt], selectedAttempt: failedAttempt });

      const retryButton = screen.getByRole('button', { name: /Réessayer/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('should call advanceStep when clicking retry button', async () => {
      const user = userEvent.setup();
      const advanceStepMock = jest.fn();
      const failedAttempt = {
        ...mockAttempt,
        status: 'failed',
        steps: [
          {
            id: 'step2',
            name: 'Approbation',
            status: 'failed',
            isOptional: false,
          },
        ],
      };
      renderComponent({ 
        attempts: [failedAttempt], 
        selectedAttempt: failedAttempt,
        advanceStep: advanceStepMock,
      });

      const retryButton = screen.getByRole('button', { name: /Réessayer/i });
      await user.click(retryButton);

      expect(advanceStepMock).toHaveBeenCalled();
    });

    test('should disable buttons while processing', () => {
      renderComponent({ 
        attempts: [mockAttempt], 
        selectedAttempt: mockAttempt,
        loading: true,
      });

      const nextButton = screen.getByRole('button', { name: /Étape suivante/i });
      expect(nextButton).toBeDisabled();
    });
  });

  // ==================== Validation Error Display Tests ====================
  describe('Validation Error Display', () => {
    test('should display validation errors in attempt card', () => {
      const attemptWithErrors = {
        id: '1',
        reference: 'REF001',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date().toISOString(),
        validationErrors: ['Email invalide', 'Montant dépasse la limite'],
      };
      renderComponent({ attempts: [attemptWithErrors] });

      expect(screen.getByText('Email invalide')).toBeInTheDocument();
      expect(screen.getByText('Montant dépasse la limite')).toBeInTheDocument();
    });

    test('should display error icon when validation fails', () => {
      const attemptWithErrors = {
        id: '1',
        reference: 'REF001',
        status: 'failed',
        currentStepNumber: 2,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date().toISOString(),
        validationErrors: ['Validation failed'],
      };
      renderComponent({ attempts: [attemptWithErrors] });

      const errorIcon = screen.getByTestId('error-icon');
      expect(errorIcon).toBeInTheDocument();
    });

    test('should display error banner at top of page', () => {
      renderComponent({ error: 'Erreur critique du système' });

      expect(screen.getByText('Erreur critique du système')).toBeInTheDocument();
    });

    test('should allow dismissing error banner', async () => {
      const user = userEvent.setup();
      const clearErrorMock = jest.fn();
      renderComponent({ 
        error: 'Test error',
        clearError: clearErrorMock,
      });

      const dismissButton = screen.getByRole('button', { name: /Fermer/i });
      await user.click(dismissButton);

      expect(clearErrorMock).toHaveBeenCalled();
    });
  });

  // ==================== Loading and Error States ====================
  describe('Loading and Error States', () => {
    test('should show spinner while loading attempts', () => {
      renderComponent({ loading: true, attempts: [] });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should hide spinner when loading completes', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <TransferAttemptsPage />
        </BrowserRouter>
      );

      useTransferAttempt.mockReturnValue({
        attempts: [
          {
            id: '1',
            reference: 'REF001',
            status: 'in-progress',
            currentStepNumber: 1,
            totalSteps: 5,
            amount: 1500,
            createdAt: new Date().toISOString(),
          },
        ],
        loading: false,
        error: null,
      });

      rerender(
        <BrowserRouter>
          <TransferAttemptsPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    test('should display error message when api fails', () => {
      renderComponent({ error: 'API Error: Connection timeout' });

      expect(screen.getByText(/API Error: Connection timeout/i)).toBeInTheDocument();
    });

    test('should show retry button on error', () => {
      renderComponent({ error: 'Failed to load attempts' });

      const retryButton = screen.getByRole('button', { name: /Réessayer/i });
      expect(retryButton).toBeInTheDocument();
    });

    test('should call getAttempts when retry button clicked', async () => {
      const user = userEvent.setup();
      const getAttemptsMock = jest.fn().mockResolvedValue([]);
      renderComponent({ 
        error: 'Failed to load',
        getAttempts: getAttemptsMock,
      });

      const retryButton = screen.getByRole('button', { name: /Réessayer/i });
      await user.click(retryButton);

      expect(getAttemptsMock).toHaveBeenCalled();
    });
  });

  // ==================== Timeline Display Tests ====================
  describe('Timeline Display', () => {
    const mockAttempt = {
      id: '1',
      reference: 'REF001',
      status: 'in-progress',
      currentStepNumber: 3,
      totalSteps: 5,
      amount: 1500,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step1',
          name: 'Vérification',
          status: 'completed',
          completedAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: 'step2',
          name: 'Approbation',
          status: 'completed',
          completedAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'step3',
          name: 'Notification',
          status: 'in-progress',
          startedAt: new Date(Date.now() - 60000).toISOString(),
        },
      ],
      stepHistory: [
        { stepId: 'step1', action: 'started', timestamp: new Date(Date.now() - 600000).toISOString() },
        { stepId: 'step1', action: 'completed', timestamp: new Date(Date.now() - 500000).toISOString() },
      ],
    };

    test('should display timeline when viewing attempt details', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const timeline = screen.getByTestId('step-timeline');
      expect(timeline).toBeInTheDocument();
    });

    test('should display completed steps in timeline', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      expect(screen.getByText('Vérification')).toBeInTheDocument();
      expect(screen.getByText('Approbation')).toBeInTheDocument();
    });

    test('should display step completion timestamps in timeline', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const timeline = screen.getByTestId('step-timeline');
      expect(within(timeline).getByText(/10 min/i)).toBeInTheDocument();
    });

    test('should show current step as active in timeline', () => {
      renderComponent({ attempts: [mockAttempt], selectedAttempt: mockAttempt });

      const timeline = screen.getByTestId('step-timeline');
      const activeStep = within(timeline).getByTestId('active-step');
      expect(activeStep).toBeInTheDocument();
    });
  });

  // ==================== Responsive Design Tests ====================
  describe('Responsive Design', () => {
    const mockAttempts = [
      {
        id: '1',
        reference: 'REF001',
        status: 'in-progress',
        currentStepNumber: 1,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date().toISOString(),
      },
    ];

    test('should display single column on mobile', () => {
      renderComponent({ attempts: mockAttempts });

      const grid = screen.getByRole('main').querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    test('should display two columns on tablet', () => {
      renderComponent({ attempts: mockAttempts });

      const grid = screen.getByRole('main').querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    test('should display three columns on desktop', () => {
      renderComponent({ attempts: mockAttempts });

      const grid = screen.getByRole('main').querySelector('.grid');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });

    test('should have readable font sizes on all screens', () => {
      renderComponent({ attempts: mockAttempts });

      const title = screen.getByText(/Suivi des Virements/i);
      expect(title).toHaveClass('text-xl', 'md:text-2xl', 'lg:text-3xl');
    });

    test('should have touch-friendly button sizes on mobile', () => {
      renderComponent({ attempts: mockAttempts });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('p-2', 'md:p-3');
      });
    });
  });

  // ==================== Accessibility Tests ====================
  describe('Accessibility', () => {
    const mockAttempt = {
      id: '1',
      reference: 'REF001',
      status: 'in-progress',
      currentStepNumber: 1,
      totalSteps: 5,
      amount: 1500,
      createdAt: new Date().toISOString(),
    };

    test('should have proper heading hierarchy', () => {
      renderComponent({ attempts: [mockAttempt] });

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Suivi des Virements/i);
    });

    test('should have accessible form inputs', () => {
      renderComponent({ attempts: [mockAttempt] });

      const searchInput = screen.getByPlaceholderText(/Chercher par référence/i);
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    test('should have descriptive button labels', () => {
      renderComponent({ attempts: [mockAttempt] });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });

    test('should have alt text for icons', () => {
      renderComponent({ attempts: [mockAttempt] });

      const icons = screen.getAllByRole('img');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('alt');
      });
    });

    test('should have proper aria-labels for status badges', () => {
      renderComponent({ attempts: [mockAttempt] });

      const statusBadge = screen.getByText(/En cours/i).parentElement;
      expect(statusBadge).toHaveAttribute('role', 'status');
    });

    test('should have progress bar with proper aria attributes', () => {
      renderComponent({ attempts: [mockAttempt] });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('should announce loading state to screen readers', () => {
      renderComponent({ loading: true });

      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-label', /Chargement/i);
    });

    test('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      renderComponent({ attempts: [mockAttempt] });

      const firstButton = screen.getAllByRole('button')[0];
      await user.tab();
      
      expect(firstButton).toHaveFocus();
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration with Context', () => {
    test('should fetch attempts on component mount', async () => {
      const getAttemptsMock = jest.fn().mockResolvedValue([]);
      renderComponent({ getAttempts: getAttemptsMock });

      await waitFor(() => {
        expect(getAttemptsMock).toHaveBeenCalled();
      });
    });

    test('should update attempts list after action', async () => {
      const user = userEvent.setup();
      const mockAttempt = {
        id: '1',
        reference: 'REF001',
        status: 'in-progress',
        currentStepNumber: 2,
        totalSteps: 5,
        amount: 1500,
        createdAt: new Date().toISOString(),
      };

      const advanceStepMock = jest.fn();
      renderComponent({ 
        attempts: [mockAttempt], 
        selectedAttempt: mockAttempt,
        advanceStep: advanceStepMock,
      });

      const nextButton = screen.getByRole('button', { name: /Étape suivante/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(advanceStepMock).toHaveBeenCalled();
      });
    });
  });
});
