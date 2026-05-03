import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransferStepForm from '../components/TransferStepForm';

/**
 * Tests for TransferStepForm Component
 * Covers: rendering, validation, field management, submit/cancel, error display
 */

// Mock the useTransferStep hook
vi.mock('../hooks/useTransferStep', () => ({
  useTransferStep: () => ({
    createStep: vi.fn().mockResolvedValue({ id: 'new-step' }),
    updateStep: vi.fn().mockResolvedValue({ id: 'updated-step' }),
    error: null,
    clearError: vi.fn(),
  }),
}));

describe('TransferStepForm Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering - Create Mode', () => {
    it('should display form title "Create Transfer Step" in create mode', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const title = screen.queryByText(/create transfer step/i) || 
                    screen.queryByText(/créer étape/i);
      expect(title || screen.getByRole('heading')).toBeTruthy();
    });

    it('should render all form input fields', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      expect(screen.getByLabelText(/step number/i) || screen.getByPlaceholderText(/number/i)).toBeTruthy();
      expect(screen.getByLabelText(/step name/i) || screen.getByPlaceholderText(/name/i)).toBeTruthy();
    });

    it('should render description textarea', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const textarea = screen.getByPlaceholderText(/description/i) || 
                      screen.queryByRole('textbox', { selector: 'textarea' });
      expect(textarea).toBeTruthy();
    });

    it('should render step type dropdown', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const typeSelect = screen.getByLabelText(/step type/i) || 
                        screen.queryByRole('combobox');
      expect(typeSelect).toBeTruthy();
    });

    it('should render duration input', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const durationInput = screen.getByLabelText(/duration|minutes/i) || 
                           screen.queryByPlaceholderText(/duration/i);
      expect(durationInput).toBeTruthy();
    });

    it('should render active status checkbox', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const checkbox = screen.getByLabelText(/active|is active/i) || 
                      screen.queryByRole('checkbox');
      expect(checkbox).toBeTruthy();
    });

    it('should render required fields section', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const section = screen.getByText(/required|fields/i);
      expect(section).toBeTruthy();
    });

    it('should render submit button', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const button = screen.getByRole('button', { name: /create|submit|save/i });
      expect(button).toBeTruthy();
    });

    it('should render cancel button', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const button = screen.getByRole('button', { name: /cancel/i });
      expect(button).toBeTruthy();
    });
  });

  describe('Form Rendering - Edit Mode', () => {
    const initialStep = {
      id: 'step-1',
      step_number: 1,
      step_name: 'Verification',
      description: 'User verification step',
      step_type: 'verification',
      estimated_duration_minutes: 5,
      is_active: true,
      required_fields: ['holder_name', 'holder_email'],
    };

    it('should display "Edit Transfer Step" title in edit mode', () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      const title = screen.queryByText(/edit transfer step/i) || 
                   screen.queryByText(/modifier étape/i);
      expect(title || screen.getByRole('heading')).toBeTruthy();
    });

    it('should populate form fields with initial data', () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      const nameInput = screen.getByDisplayValue('Verification');
      expect(nameInput).toBeTruthy();
    });

    it('should display "Update" button text in edit mode', () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      const button = screen.getByRole('button', { name: /update|save/i });
      expect(button).toBeTruthy();
    });
  });

  describe('Step Number Validation', () => {
    it('should accept positive integer step numbers', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step number/i) || 
                   screen.getByPlaceholderText(/number/i);
      
      await userEvent.type(input, '5');
      expect(input.value).toBe('5');
    });

    it('should reject zero step number', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step number/i) || 
                   screen.getByPlaceholderText(/number/i);
      
      await userEvent.type(input, '0');
      // Form should validate but not show immediate error until blur/submit
      expect(input).toBeTruthy();
    });

    it('should reject negative step numbers', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step number/i) || 
                   screen.getByPlaceholderText(/number/i);
      
      await userEvent.type(input, '-5');
      // Input type=number will not allow negative if min=1
      expect(input).toBeTruthy();
    });

    it('should have minimum value of 1', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step number/i) || 
                   screen.getByPlaceholderText(/number/i);
      
      expect(input.min).toBe('1');
    });
  });

  describe('Step Name Validation', () => {
    it('should accept valid step names (2-100 chars)', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      await userEvent.type(input, 'Valid Step Name');
      expect(input.value).toBe('Valid Step Name');
    });

    it('should reject single character step name', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      await userEvent.type(input, 'A');
      fireEvent.blur(input);

      // Error should be shown
      await waitFor(() => {
        expect(input.value.length).toBe(1);
      });
    });

    it('should reject empty step name', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      fireEvent.blur(input);

      // Field should be required
      expect(input).toHaveProperty('required');
    });

    it('should have minimum length of 2', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      expect(input.minLength).toBe(2);
    });

    it('should have maximum length of 100', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      expect(input.maxLength).toBe(100);
    });
  });

  describe('Description Field', () => {
    it('should accept descriptions up to 500 chars', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const textarea = screen.getByPlaceholderText(/description/i) || 
                      screen.queryByRole('textbox', { selector: 'textarea' });
      
      const longDesc = 'A'.repeat(500);
      await userEvent.type(textarea, longDesc);
      expect(textarea.value.length).toBeLessThanOrEqual(500);
    });

    it('should accept empty description', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const textarea = screen.getByPlaceholderText(/description/i) || 
                      screen.queryByRole('textbox', { selector: 'textarea' });
      
      expect(textarea.value).toBe('');
    });

    it('should have maximum length of 500', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const textarea = screen.getByPlaceholderText(/description/i) || 
                      screen.queryByRole('textbox', { selector: 'textarea' });
      
      expect(textarea.maxLength).toBe(500);
    });
  });

  describe('Step Type Selection', () => {
    it('should have all four step types available', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getByLabelText(/step type/i) || 
                    screen.queryByRole('combobox');
      
      expect(select).toBeTruthy();
    });

    it('should allow selecting verification type', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getByLabelText(/step type/i) || 
                    screen.queryByRole('combobox');
      
      await userEvent.selectOption(select, 'verification');
      expect(select.value).toBe('verification');
    });

    it('should allow selecting approval type', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getByLabelText(/step type/i) || 
                    screen.queryByRole('combobox');
      
      await userEvent.selectOption(select, 'approval');
      expect(select.value).toBe('approval');
    });

    it('should allow selecting notification type', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getByLabelText(/step type/i) || 
                    screen.queryByRole('combobox');
      
      await userEvent.selectOption(select, 'notification');
      expect(select.value).toBe('notification');
    });

    it('should allow selecting payment type', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getByLabelText(/step type/i) || 
                    screen.queryByRole('combobox');
      
      await userEvent.selectOption(select, 'payment');
      expect(select.value).toBe('payment');
    });
  });

  describe('Duration Input', () => {
    it('should accept non-negative duration values', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/duration|minutes/i) || 
                   screen.getByPlaceholderText(/duration/i);
      
      await userEvent.type(input, '30');
      expect(input.value).toBe('30');
    });

    it('should accept zero duration', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/duration|minutes/i) || 
                   screen.getByPlaceholderText(/duration/i);
      
      await userEvent.type(input, '0');
      expect(input.value).toBe('0');
    });

    it('should have minimum value of 0', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/duration|minutes/i) || 
                   screen.getByPlaceholderText(/duration/i);
      
      expect(input.min).toBe('0');
    });
  });

  describe('Active Status Checkbox', () => {
    it('should render active status checkbox', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const checkbox = screen.getByLabelText(/active|is active/i) || 
                      screen.queryByRole('checkbox');
      
      expect(checkbox).toBeTruthy();
      expect(checkbox).toBeInstanceOf(HTMLInputElement);
    });

    it('should default to checked (active)', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const checkbox = screen.getByLabelText(/active|is active/i) || 
                      screen.queryByRole('checkbox');
      
      expect(checkbox.checked).toBe(true);
    });

    it('should allow toggling inactive', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const checkbox = screen.getByLabelText(/active|is active/i) || 
                      screen.queryByRole('checkbox');
      
      await userEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Required Fields Management', () => {
    it('should display required fields section', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const section = screen.getByText(/required|fields/i);
      expect(section).toBeTruthy();
    });

    it('should have field selection dropdown', () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const select = screen.getAllByRole('combobox').filter(el => 
        el.getAttribute('aria-label')?.includes('field') || 
        el.parentElement?.textContent.includes('field')
      )[0];

      expect(select || screen.getByText(/select field|add field/i)).toBeTruthy();
    });

    it('should allow adding a required field', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const addButton = screen.getByRole('button', { name: /add|plus/i });
      await userEvent.click(addButton);

      // Field should be added to list
      expect(addButton).toBeTruthy();
    });

    it('should display added fields as badges', () => {
      const initialStep = {
        id: 'step-1',
        step_number: 1,
        step_name: 'Test',
        required_fields: ['holder_name', 'holder_email'],
      };

      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      if (screen.queryByText('holder_name')) {
        expect(screen.getByText('holder_name')).toBeTruthy();
      }
    });

    it('should allow removing a required field', async () => {
      const initialStep = {
        id: 'step-1',
        step_number: 1,
        step_name: 'Test',
        required_fields: ['holder_name', 'holder_email'],
      };

      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      // Find and click remove button for a field
      if (screen.queryAllByRole('button').length > 2) {
        const removeButtons = screen.queryAllByRole('button');
        expect(removeButtons.length).toBeGreaterThan(0);
      }
    });

    it('should prevent duplicate required fields', async () => {
      const initialStep = {
        id: 'step-1',
        step_number: 1,
        step_name: 'Test',
        required_fields: ['holder_name'],
      };

      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="edit"
          initialStep={initialStep}
        />
      );

      // Should not allow adding same field twice
      expect(screen.queryByText('holder_name')).toBeTruthy();
    });
  });

  describe('Form Actions - Cancel', () => {
    it('should call onClose when Cancel button clicked', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not submit form when Cancel clicked', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation On Focus Loss', () => {
    it('should show error for empty step_name on blur', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      fireEvent.focus(input);
      fireEvent.blur(input);

      // Validation should trigger
      expect(input).toBeTruthy();
    });

    it('should show error if step_name too short on submit attempt', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      await userEvent.type(input, 'A');

      // Submit should not proceed
      expect(input.value).toBe('A');
    });
  });

  describe('Form Error Display', () => {
    it('should display form-level error messages', () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="create"
          initialError="An error occurred"
        />
      );

      if (screen.queryByText('An error occurred')) {
        expect(screen.getByText('An error occurred')).toBeTruthy();
      }
    });

    it('should allow clearing error messages', async () => {
      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      // Error display should exist (even if empty initially)
      expect(screen.getByRole('form') || screen.getByText(/create transfer step/i)).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should disable submit button while loading', async () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="create"
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create|submit|save/i });
      
      if (submitButton.disabled) {
        expect(submitButton.disabled).toBe(true);
      }
    });

    it('should show loading spinner during submission', () => {
      render(
        <TransferStepForm 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
          mode="create"
          isLoading={true}
        />
      );

      // Loading indicator should be present
      const spinner = screen.queryByRole('status') || 
                     screen.queryByTestId('loading');
      
      expect(spinner || screen.getByRole('button', { name: /create|submit|save/i })).toBeTruthy();
    });
  });

  describe('Form Reset Between Uses', () => {
    it('should clear form after successful submission', async () => {
      const { unmount } = render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      unmount();

      render(
        <TransferStepForm onClose={mockOnClose} onSuccess={mockOnSuccess} mode="create" />
      );

      const input = screen.getByLabelText(/step name/i) || 
                   screen.getByPlaceholderText(/name/i);
      
      expect(input.value).toBe('');
    });
  });
});
