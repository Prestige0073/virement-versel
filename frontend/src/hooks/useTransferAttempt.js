import { useContext } from 'react';
import { TransferAttemptContext } from '../context/TransferAttemptContext';

/**
 * useTransferAttempt Hook
 * 
 * Access TransferAttemptContext in functional components
 * 
 * Usage:
 * const { attempts, createAttempt, startStep, completeStep } = useTransferAttempt();
 * 
 * @throws Error if used outside TransferAttemptProvider
 * @returns {Object} TransferAttemptContext value
 */
export const useTransferAttempt = () => {
  const context = useContext(TransferAttemptContext);

  if (!context) {
    throw new Error(
      'useTransferAttempt must be used within a TransferAttemptProvider'
    );
  }

  return context;
};
