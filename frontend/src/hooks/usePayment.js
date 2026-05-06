import { useContext } from 'react';
import { PaymentContext } from '../context/PaymentContext';

/**
 * usePayment - Hook pour accéder au contexte de paiement (LeekPay)
 * 
 * Utilisation:
 * const { createPayment, initiateLeekpayPayment, payments } = usePayment();
 * 
 * @returns {Object} - Payment context avec toutes les méthodes
 * @throws {Error} - Si utilisé en dehors d'PaymentProvider
 */
export const usePayment = () => {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error(
      'usePayment() must be used within a <PaymentProvider> component'
    );
  }

  return context;
};

export default usePayment;
