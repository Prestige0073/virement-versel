import { useContext } from 'react';
import { BankAccountContext } from '../context/BankAccountContext';

/**
 * Hook personnalisé pour accéder au contexte des comptes bancaires
 */
export const useBankAccount = () => {
  const context = useContext(BankAccountContext);
  
  if (!context) {
    throw new Error('useBankAccount must be used within BankAccountProvider');
  }
  
  return context;
};
