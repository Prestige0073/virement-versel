import { useState } from 'react';
import { useBankAccount } from '../hooks/useBankAccount';

/**
 * BankAccountForm - Formulaire création/édition compte bancaire
 * Validation complète + upload logo
 */
function BankAccountForm({ accountId, onSuccess, onCancel }) {
  const { createAccount, updateAccount, loading, error: contextError } = useBankAccount();
  const [formData, setFormData] = useState({
    holder_name: '',
    holder_email: '',
    phone: '',
    address: '',
    iban: '',
    bic: '',
    bank_name: '',
    branch: '',
    account_type: 'courant',
    tier: 'basique',
    currency: 'XOF',
    current_balance: 0,
    language: 'fr',
    logoFile: null,
  });

  const [errors, setErrors] = useState({});
  const [previewLogo, setPreviewLogo] = useState(null);

  const accountTypes = [
    { value: 'courant', label: 'Compte Courant' },
    { value: 'épargne', label: 'Compte Épargne' },
    { value: 'pro', label: 'Compte Professionnel' },
    { value: 'business', label: 'Compte Entreprise' },
  ];

  const accountTiers = [
    { value: 'basique', label: 'Basique' },
    { value: 'premium', label: 'Premium' },
    { value: 'vip', label: 'VIP' },
  ];

  const currencies = ['XOF', 'EUR', 'USD'];

  /**
   * Validation du formulaire
   */
  const validateForm = () => {
    const newErrors = {};

    // Holdar name
    if (!formData.holder_name?.trim()) {
      newErrors.holder_name = 'Le nom est requis';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.holder_email?.trim() || !emailRegex.test(formData.holder_email)) {
      newErrors.holder_email = 'Email invalide';
    }

    // Téléphone
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!/^\d{8,15}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Téléphone invalide (8-15 chiffres)';
    }

    // Adresse
    if (!formData.address?.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    // IBAN
    if (!formData.iban?.trim()) {
      newErrors.iban = 'L\'IBAN est requis';
    } else if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(formData.iban.toUpperCase())) {
      newErrors.iban = 'IBAN invalide (ex: CI05A123...)';
    }

    // BIC
    if (!formData.bic?.trim()) {
      newErrors.bic = 'Le BIC est requis';
    } else if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(formData.bic.toUpperCase())) {
      newErrors.bic = 'BIC invalide (8-11 caractères)';
    }

    // Bank name
    if (!formData.bank_name?.trim()) {
      newErrors.bank_name = 'Le nom de la banque est requis';
    }

    // Balance
    if (formData.current_balance < 0) {
      newErrors.current_balance = 'Le solde ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gestion changement input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Supprimer erreur du champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /**
   * Gestion upload logo
   */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logoFile: file,
      }));

      // Afficher prévisualisation
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewLogo(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Soumettre le formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result;
      if (accountId) {
        result = await updateAccount(accountId, formData);
      } else {
        result = await createAccount(formData);
      }

      if (result.success) {
        onSuccess?.(result.data);
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erreur générale */}
      {contextError && (
        <div className="bg-danger-50 border border-danger-300 text-danger-800 px-4 py-3 rounded-lg">
          ✗ {contextError}
        </div>
      )}

      {/* Section: Titulaire du Compte */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Titulaire du Compte</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nom Complet *
            </label>
            <input
              type="text"
              name="holder_name"
              value={formData.holder_name}
              onChange={handleChange}
              className={`input-field w-full ${errors.holder_name ? 'border-danger-500' : ''}`}
              placeholder="Jean Dupont"
              disabled={loading}
            />
            {errors.holder_name && (
              <p className="text-danger-600 text-sm mt-1">{errors.holder_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email *
            </label>
            <input
              type="email"
              name="holder_email"
              value={formData.holder_email}
              onChange={handleChange}
              className={`input-field w-full ${errors.holder_email ? 'border-danger-500' : ''}`}
              placeholder="jean@example.com"
              disabled={loading}
            />
            {errors.holder_email && (
              <p className="text-danger-600 text-sm mt-1">{errors.holder_email}</p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`input-field w-full ${errors.phone ? 'border-danger-500' : ''}`}
              placeholder="628365841"
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-danger-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Adresse *
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`input-field w-full ${errors.address ? 'border-danger-500' : ''}`}
              placeholder="123 Rue de la Paix, Abidjan"
              disabled={loading}
            />
            {errors.address && (
              <p className="text-danger-600 text-sm mt-1">{errors.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Coordonnées Bancaires */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏦 Coordonnées Bancaires</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IBAN */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              IBAN *
            </label>
            <input
              type="text"
              name="iban"
              value={formData.iban}
              onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
              className={`input-field w-full ${errors.iban ? 'border-danger-500' : ''}`}
              placeholder="CI05A12345678901234567890"
              disabled={loading}
            />
            {errors.iban && (
              <p className="text-danger-600 text-sm mt-1">{errors.iban}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Format: 2 lettres pays + 2 chiffres + caractères alphanumériques</p>
          </div>

          {/* BIC */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              BIC *
            </label>
            <input
              type="text"
              name="bic"
              value={formData.bic}
              onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
              className={`input-field w-full ${errors.bic ? 'border-danger-500' : ''}`}
              placeholder="ABCDCI2X"
              disabled={loading}
            />
            {errors.bic && (
              <p className="text-danger-600 text-sm mt-1">{errors.bic}</p>
            )}
          </div>

          {/* Nom Banque */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Banque *
            </label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className={`input-field w-full ${errors.bank_name ? 'border-danger-500' : ''}`}
              placeholder="Banque Atlantique"
              disabled={loading}
            />
            {errors.bank_name && (
              <p className="text-danger-600 text-sm mt-1">{errors.bank_name}</p>
            )}
          </div>

          {/* Branche */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Branche (optionnel)
            </label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Abidjan Centre"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Section: Configuration */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Compte */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Type de Compte
            </label>
            <select
              name="account_type"
              value={formData.account_type}
              onChange={handleChange}
              className="input-field w-full"
              disabled={loading}
            >
              {accountTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Niveau (Tier)
            </label>
            <select
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              className="input-field w-full"
              disabled={loading}
            >
              {accountTiers.map(tier => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Devise */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Devise
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="input-field w-full"
              disabled={loading}
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Solde Initial */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Solde Initial
            </label>
            <input
              type="number"
              name="current_balance"
              value={formData.current_balance}
              onChange={handleChange}
              className={`input-field w-full ${errors.current_balance ? 'border-danger-500' : ''}`}
              placeholder="0"
              disabled={loading}
              min="0"
            />
            {errors.current_balance && (
              <p className="text-danger-600 text-sm mt-1">{errors.current_balance}</p>
            )}
          </div>

          {/* Langue */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Langue
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="input-field w-full"
              disabled={loading}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Logo Bancaire */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Logo Bancaire</h3>

        <div className="flex gap-6">
          {/* Upload */}
          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Télécharger un logo (optionnel)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleLogoChange}
              className="input-field w-full"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-2">
              Format: PNG, JPEG, WebP | Taille max: 5MB
            </p>
          </div>

          {/* Prévisualisation */}
          {previewLogo && (
            <div className="flex-1">
              <p className="text-gray-700 font-semibold mb-2">Aperçu</p>
              <img
                src={previewLogo}
                alt="Bank logo preview"
                className="h-24 w-auto object-contain border border-gray-300 rounded-lg p-2 bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? '⏳ Enregistrement...' : accountId ? '✔️ Mettre à jour' : '✔️ Créer le Compte'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn btn-secondary flex-1"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

export default BankAccountForm;
