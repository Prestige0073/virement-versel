import { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';
import { useAuth } from '../hooks/useAuth';
import { PAYMENT_PROVIDERS, MOBILE_OPERATORS, CURRENCY_CODES } from '../config/paymentProviders';
import SimulationBanner from '../components/SimulationBanner';

/**
 * PaymentPage - Page de paiement mobile money
 * Intégration FedaPay, Kkiapay, CinetPay, LeekPay ⭐ NEW
 */
function PaymentPage() {
  const { user } = useAuth();
  const { 
    createPayment, 
    initiateFedapayPayment, 
    initiateKkiapayPayment,
    initiateLeekpayPayment, // ⭐ NEW
    loading, 
    error, 
    clearError 
  } = usePayment();

  const [formData, setFormData] = useState({
    amount: '',
    currency: CURRENCY_CODES.XOF,
    recipient: {
      name: '',
      iban: '',
      bic: '',
      bank: '',
    },
    phone: '',
    operator: MOBILE_OPERATORS.ORANGE,
    provider: PAYMENT_PROVIDERS.FEDAPAY,
    description: '',
  });

  const [validationError, setValidationError] = useState('');
  const [step, setStep] = useState(1); // 1: form, 2: review, 3: payment

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('recipient.')) {
      const field = name.replace('recipient.', '');
      setFormData(prev => ({
        ...prev,
        recipient: { ...prev.recipient, [field]: value },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setValidationError('');
    clearError();
  };

  const validateForm = () => {
    // Amount validation
    if (!formData.amount || Number(formData.amount) <= 0) {
      setValidationError('Montant invalide');
      return false;
    }

    if (Number(formData.amount) < 100) {
      setValidationError('Montant minimum: 100 XOF');
      return false;
    }

    if (Number(formData.amount) > 5000000) {
      setValidationError('Montant maximum: 5,000,000 XOF');
      return false;
    }

    // Phone validation
    if (!formData.phone || formData.phone.length < 8) {
      setValidationError('Numéro téléphone invalide');
      return false;
    }

    // Recipient validation
    if (!formData.recipient.name) {
      setValidationError('Nom du bénéficiaire requis');
      return false;
    }

    if (!formData.recipient.iban) {
      setValidationError('IBAN requis');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleSubmitPayment = async () => {
    try {
      setValidationError('');
      
      // Créer la transaction
      const paymentResult = await createPayment(formData);

      if (!paymentResult.success) {
        setValidationError(paymentResult.error);
        return;
      }

      const transfer = paymentResult.transfer;
      setStep(3);

      // Initialiser le paiement avec le provider choisi
      if (formData.provider === PAYMENT_PROVIDERS.FEDAPAY) {
        await initiateFedapayPayment(transfer);
      } else if (formData.provider === PAYMENT_PROVIDERS.KKIAPAY) {
        await initiateKkiapayPayment(transfer);
      } else if (formData.provider === PAYMENT_PROVIDERS.LEEKPAY) {
        await initiateLeekpayPayment(transfer); // ⭐ NEW
      }
    } catch (err) {
      setValidationError(err.message || 'Erreur lors du paiement');
    }
  };

  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            {/* Header */}
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              💰 Paiement Mobile Money
            </h1>
            <p className="text-gray-600 mb-6">
              Effectuez un virement par mobile money - Étape {step} sur 3
            </p>

            {/* Progress Bar */}
            <div className="mb-8 flex gap-4">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step
                      ? 'bg-primary-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {(error || validationError) && (
              <div className="bg-danger-50 border border-danger-300 text-danger-800 px-4 py-3 rounded-lg mb-6">
                ✗ {error || validationError}
              </div>
            )}

            {/* Étape 1: Formulaire */}
            {step === 1 && (
              <div className="space-y-6">
                
                {/* Montant */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Montant *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="input-field flex-1"
                      placeholder="Entrez le montant"
                      disabled={loading}
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="input-field w-24"
                      disabled={loading}
                    >
                      {Object.values(CURRENCY_CODES).map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Min: 100 | Max: 5,000,000</p>
                </div>

                {/* Numéro Téléphone */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Numéro Téléphone *
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="operator"
                      value={formData.operator}
                      onChange={handleChange}
                      className="input-field w-32"
                      disabled={loading}
                    >
                      {Object.entries(MOBILE_OPERATORS).map(([key, value]) => (
                        <option key={value} value={value}>{key}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field flex-1"
                      placeholder="628365841"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Destinataire */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Bénéficiaire</h3>
                  <input
                    type="text"
                    name="recipient.name"
                    value={formData.recipient.name}
                    onChange={handleChange}
                    className="input-field w-full mb-3"
                    placeholder="Nom du bénéficiaire"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="recipient.iban"
                    value={formData.recipient.iban}
                    onChange={handleChange}
                    className="input-field w-full mb-3"
                    placeholder="IBAN (ex: CI05A12345678901234567890)"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="recipient.bic"
                    value={formData.recipient.bic}
                    onChange={handleChange}
                    className="input-field w-full mb-3"
                    placeholder="BIC"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    name="recipient.bank"
                    value={formData.recipient.bank}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Banque"
                    disabled={loading}
                  />
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Fournisseur de Paiement *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[PAYMENT_PROVIDERS.FEDAPAY, PAYMENT_PROVIDERS.KKIAPAY, PAYMENT_PROVIDERS.LEEKPAY].map(provider => (
                      <button
                        key={provider}
                        onClick={() => setFormData(prev => ({ ...prev, provider }))}
                        className={`p-3 rounded-lg border-2 transition-all font-semibold uppercase text-sm ${
                          formData.provider === provider
                            ? 'border-primary-600 bg-primary-50 text-primary-900'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-600'
                        }`}
                        disabled={loading}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Raison du virement..."
                    rows="3"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={handleNext}
                  className="btn-primary w-full disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Vérification...' : 'Suivant →'}
                </button>
              </div>
            )}

            {/* Étape 2: Révision */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm">Montant</p>
                    <p className="text-2xl font-bold text-primary-900">
                      {formData.amount} {formData.currency}
                    </p>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-gray-600 text-sm">Bénéficiaire</p>
                    <p className="font-semibold text-gray-900">{formData.recipient.name}</p>
                    <p className="text-xs text-gray-600">{formData.recipient.iban}</p>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-gray-600 text-sm">Via {formData.operator.toUpperCase()}</p>
                    <p className="font-mono text-gray-900">{formData.phone}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded">
                  ⚠️ Vérifiez tous les détails avant de confirmer. Une fois le paiement envoyé, il ne peut être annulé.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 btn-primary disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Traitement...' : 'Confirmer le Paiement'}
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3: Paiement en cours */}
            {step === 3 && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Traitement du paiement...</h2>
                <p className="text-gray-600">
                  Veuillez suivre les instructions sur {formData.provider}
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Ne fermez pas cette page
                </p>
              </div>
            )}

          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>ℹ️ Informations:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Frais: 0.5% - 1.5% selon le montant</li>
              <li>• Temps de traitement: 5-30 minutes</li>
              <li>• Mode simulation: Pas de débit réel</li>
              <li>• Support: support@simulateur.local</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentPage;
