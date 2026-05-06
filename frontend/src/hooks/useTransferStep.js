import { useContext } from 'react';
import { TransferStepContext } from '../context/TransferStepContext';

/**
 * useTransferStep - Hook pour accéder au contexte TransferStep
 * @returns {Object} TransferStep context
 * @throws {Error} Si utilisé en dehors du TransferStepProvider
 */
export function useTransferStep() {
  const context = useContext(TransferStepContext);

  if (!context) {
    throw new Error(
      'useTransferStep doit être utilisé à l\'intérieur de <TransferStepProvider>'
    );
  }

  return context;
}

export default useTransferStep;
