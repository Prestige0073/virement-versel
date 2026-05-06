import React, { createContext, useState, useCallback } from 'react';
import { sanitizeString } from '../utils/sanitizer';
import { isRateLimited } from '../utils/rateLimiter';

/**
 * TransferAttemptContext
 * 
 * Manages active transfer attempt execution state, step tracking,
 * and workflow transitions with full audit trail.
 * 
 * Features:
 * - Create/manage transfer attempts
 * - Track step execution with history
 * - Validate and complete steps
 * - Handle conditional branching
 * - Store validation/execution results
 * - Rate limiting on sensitive operations
 */

export const TransferAttemptContext = createContext();

export const TransferAttemptProvider = ({ children }) => {
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a new transfer attempt
   * Starts tracking a transfer through its workflow
   * 
   * Rate limited: 5 create attempts per minute
   */
  const createAttempt = useCallback(async (transferId, transferData) => {
    if (isRateLimited(`transfer-attempt-create-${transferId}`, 5, 60000)) {
      setError('Trop de tentatives effectuées. Veuillez réessayer dans une minute.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate input
      if (!transferId || !transferData) {
        throw new Error('Transfer ID and data required');
      }

      // Validate required fields in transferData
      const requiredFields = ['holder_name', 'amount', 'currency'];
      const missing = requiredFields.filter(f => !transferData[f]);
      if (missing.length > 0) {
        throw new Error(`Champs manquants: ${missing.join(', ')}`);
      }

      const newAttempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        transfer_id: sanitizeString(transferId),
        transfer_data: {
          ...transferData,
          holder_name: sanitizeString(transferData.holder_name),
          amount: parseFloat(transferData.amount),
          currency: sanitizeString(transferData.currency),
          description: sanitizeString(transferData.description || ''),
        },
        status: 'pending', // pending, started, step_in_progress, completed, failed, cancelled
        current_step: null,
        current_step_number: 0,
        completed_steps: [],
        step_history: [],
        skipped_steps: [],
        validation_results: {},
        execution_results: {},
        errors: [],
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => [newAttempt, ...prev]);
      setCurrentAttempt(newAttempt);

      return newAttempt;
    } catch (err) {
      const message = err.message || 'Erreur lors de la création de la tentative';
      setError(message);
      console.error('Create attempt error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a specific transfer attempt
   */
  const getAttempt = useCallback(async (attemptId) => {
    try {
      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }
      return attempt;
    } catch (err) {
      setError(err.message || 'Erreur en récupération de tentative');
      return null;
    }
  }, [attempts]);

  /**
   * Start executing a step
   * 
   * Rate limited: 20 step starts per minute
   */
  const startStep = useCallback(async (attemptId, step) => {
    if (isRateLimited(`transfer-step-start-${attemptId}`, 20, 60000)) {
      setError('Trop de transitions d\'étapes. Veuillez réessayer après.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (!attemptId || !step || !step.id) {
        throw new Error('Attempt ID and step required');
      }

      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      // Cannot start if already in step
      if (attempt.status === 'step_in_progress') {
        throw new Error('Une étape est déjà en cours. Complétez-la d\'abord.');
      }

      const updatedAttempt = {
        ...attempt,
        status: 'step_in_progress',
        current_step: {
          id: step.id,
          number: step.step_number,
          name: sanitizeString(step.step_name),
          type: step.step_type,
        },
        current_step_number: step.step_number,
        started_at: attempt.started_at || new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(updatedAttempt);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en démarrage de l\'étape';
      setError(message);
      console.error('Start step error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Complete a step with validation results
   * 
   * Rate limited: 15 step completions per minute
   */
  const completeStep = useCallback(async (attemptId, stepId, validationData = {}) => {
    if (isRateLimited(`transfer-step-complete-${attemptId}`, 15, 60000)) {
      setError('Trop de complétions d\'étapes. Veuillez réessayer après.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (!attemptId || !stepId) {
        throw new Error('Attempt and step IDs required');
      }

      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      if (!attempt.current_step || attempt.current_step.id !== stepId) {
        throw new Error('Cette étape n\'est pas en cours');
      }

      // Sanitize validation data
      const sanitizedData = {};
      Object.entries(validationData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          sanitizedData[key] = sanitizeString(value);
        } else {
          sanitizedData[key] = value;
        }
      });

      const completedStep = {
        ...attempt.current_step,
        completed_at: new Date().toISOString(),
        validation_data: sanitizedData,
      };

      const updatedAttempt = {
        ...attempt,
        status: 'started', // Back to started, waiting for next step
        current_step: null,
        completed_steps: [...attempt.completed_steps, stepId],
        step_history: [
          ...attempt.step_history,
          {
            step_id: stepId,
            step_number: attempt.current_step_number,
            status: 'completed',
            started_at: attempt.last_updated_at,
            completed_at: new Date().toISOString(),
          },
        ],
        validation_results: {
          ...attempt.validation_results,
          [stepId]: sanitizedData,
        },
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(updatedAttempt);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en completion de l\'étape';
      setError(message);
      console.error('Complete step error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Fail a step with error details
   * 
   * Rate limited: 10 step failures per minute
   */
  const failStep = useCallback(async (attemptId, stepId, errorDetails) => {
    if (isRateLimited(`transfer-step-fail-${attemptId}`, 10, 60000)) {
      setError('Trop d\'erreurs d\'étapes. Veuillez réessayer après.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (!attemptId || !stepId || !errorDetails) {
        throw new Error('Attempt, step ID, and error details required');
      }

      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      const sanitizedError = {
        code: sanitizeString(errorDetails.code || 'UNKNOWN_ERROR'),
        message: sanitizeString(errorDetails.message || 'Une erreur inconnue s\'est produite'),
        details: typeof errorDetails.details === 'string'
          ? sanitizeString(errorDetails.details)
          : errorDetails.details,
      };

      const updatedAttempt = {
        ...attempt,
        status: 'failed',
        current_step: null,
        step_history: [
          ...attempt.step_history,
          {
            step_id: stepId,
            step_number: attempt.current_step_number,
            status: 'failed',
            error: sanitizedError,
            timestamp: new Date().toISOString(),
          },
        ],
        errors: [...attempt.errors, sanitizedError],
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(updatedAttempt);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en marquage d\'échec de l\'étape';
      setError(message);
      console.error('Fail step error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Skip a step based on conditional logic
   * 
   * Rate limited: 10 step skips per minute
   */
  const skipStep = useCallback(async (attemptId, stepId, reason) => {
    if (isRateLimited(`transfer-step-skip-${attemptId}`, 10, 60000)) {
      setError('Trop de sauts d\'étapes. Veuillez réessayer après.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (!attemptId || !stepId || !reason) {
        throw new Error('Attempt, step ID, and skip reason required');
      }

      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      const sanitizedReason = sanitizeString(reason);

      const updatedAttempt = {
        ...attempt,
        skipped_steps: [...attempt.skipped_steps, stepId],
        step_history: [
          ...attempt.step_history,
          {
            step_id: stepId,
            status: 'skipped',
            reason: sanitizedReason,
            timestamp: new Date().toISOString(),
          },
        ],
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(updatedAttempt);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en saut d\'étape';
      setError(message);
      console.error('Skip step error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Complete the entire transfer attempt successfully
   */
  const completeAttempt = useCallback(async (attemptId) => {
    setLoading(true);
    setError(null);

    try {
      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      if (attempt.current_step) {
        throw new Error('Complétez l\'étape en cours avant de terminer');
      }

      const updatedAttempt = {
        ...attempt,
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(updatedAttempt);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en completion de tentative';
      setError(message);
      console.error('Complete attempt error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Cancel a transfer attempt with reason
   * 
   * Rate limited: 5 cancellations per minute
   */
  const cancelAttempt = useCallback(async (attemptId, reason) => {
    if (isRateLimited(`transfer-attempt-cancel-${attemptId}`, 5, 60000)) {
      setError('Trop d\'annulations. Veuillez réessayer après.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      if (!attemptId || !reason) {
        throw new Error('Attempt ID and cancellation reason required');
      }

      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Tentative non trouvée');
      }

      if (attempt.status === 'completed' || attempt.status === 'failed') {
        throw new Error('Impossible d\'annuler une tentative terminée');
      }

      const sanitizedReason = sanitizeString(reason);

      const updatedAttempt = {
        ...attempt,
        status: 'cancelled',
        current_step: null,
        completed_at: new Date().toISOString(),
        cancellation_reason: sanitizedReason,
        last_updated_at: new Date().toISOString(),
      };

      setAttempts(prev => prev.map(a => a.id === attemptId ? updatedAttempt : a));
      setCurrentAttempt(null);

      return updatedAttempt;
    } catch (err) {
      const message = err.message || 'Erreur en annulation de tentative';
      setError(message);
      console.error('Cancel attempt error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [attempts]);

  /**
   * Get all transfer attempts for user with optional filters
   */
  const getAttempts = useCallback(async (filters = {}) => {
    try {
      let filtered = [...attempts];

      // Filter by status
      if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status);
      }

      // Filter by transfer_id
      if (filters.transferId) {
        filtered = filtered.filter(a => a.transfer_id === filters.transferId);
      }

      // Filter by date range
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        filtered = filtered.filter(a => {
          const created = new Date(a.created_at);
          return created >= start && created <= end;
        });
      }

      // Sort by created date (newest first)
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (err) {
      setError(err.message || 'Erreur en récupération des tentatives');
      return [];
    }
  }, [attempts]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get execution history for an attempt
   */
  const getExecutionHistory = useCallback((attemptId) => {
    const attempt = attempts.find(a => a.id === attemptId);
    if (!attempt) return [];

    return attempt.step_history.map(entry => ({
      ...entry,
      timestamp: entry.timestamp || entry.started_at || entry.completed_at,
    }));
  }, [attempts]);

  /**
   * Get validation results for an attempt
   */
  const getValidationResults = useCallback((attemptId) => {
    const attempt = attempts.find(a => a.id === attemptId);
    if (!attempt) return {};

    return attempt.validation_results;
  }, [attempts]);

  const value = {
    // State
    attempts,
    currentAttempt,
    loading,
    error,

    // Methods
    createAttempt,
    getAttempt,
    startStep,
    completeStep,
    failStep,
    skipStep,
    completeAttempt,
    cancelAttempt,
    getAttempts,
    getExecutionHistory,
    getValidationResults,
    clearError,
  };

  return (
    <TransferAttemptContext.Provider value={value}>
      {children}
    </TransferAttemptContext.Provider>
  );
};
