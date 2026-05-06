import React, { useState, useEffect } from 'react';
import { useTransferStep } from '../hooks/useTransferStep';

/**
 * TransferStepForm - Formulaire pour créer/éditer une étape de virement
 * Champs: step_number, step_name, description, type, champs requis, validations
 */
export default function TransferStepForm({ stepData = null, onSave, onCancel }) {
  const { createStep, updateStep, loading, error } = useTransferStep();
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    step_number: 1,
    step_name: '',
    description: '',
    step_type: 'verification',
    required_fields: [],
    validations: {},
    is_active: true,
    estimated_duration_minutes: 5,
  });
  const [newField, setNewField] = useState('');

  const STEP_TYPES = [
    { value: 'verification', label: 'Vérification' },
    { value: 'approval', label: 'Approbation' },
    { value: 'notification', label: 'Notification' },
    { value: 'payment', label: 'Paiement' },
  ];

  const AVAILABLE_FIELDS = [
    'holder_name',
    'holder_email',
    'phone',
    'address',
    'iban',
    'bic',
    'bank_name',
    'amount',
    'currency',
    'recipient_name',
    'recipient_iban',
    'recipient_bic',
    'description',
  ];

  // Initialiser avec les données existantes
  useEffect(() => {
    if (stepData) {
      setFormData({
        step_number: stepData.step_number || 1,
        step_name: stepData.step_name || '',
        description: stepData.description || '',
        step_type: stepData.step_type || 'verification',
        required_fields: stepData.required_fields || [],
        validations: stepData.validations || {},
        is_active: stepData.is_active !== false,
        estimated_duration_minutes: stepData.estimated_duration_minutes || 5,
      });
    }
  }, [stepData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    }));
    setFormError('');
  };

  const handleAddField = () => {
    if (!newField || formData.required_fields.includes(newField)) {
      setFormError('Sélectionnez un champ valide non encore ajouté');
      return;
    }

    setFormData(prev => ({
      ...prev,
      required_fields: [...prev.required_fields, newField],
    }));
    setNewField('');
  };

  const handleRemoveField = (field) => {
    setFormData(prev => ({
      ...prev,
      required_fields: prev.required_fields.filter(f => f !== field),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.step_name || formData.step_name.length < 2) {
      setFormError('Nom d\'étape requis (minimum 2 caractères)');
      return;
    }

    if (formData.step_number < 1) {
      setFormError('Numéro d\'étape doit être >= 1');
      return;
    }

    if (formData.estimated_duration_minutes < 0) {
      setFormError('Durée estimée ne peut pas être négative');
      return;
    }

    try {
      let result;

      if (stepData?.id) {
        // Mise à jour
        result = await updateStep(stepData.id, formData);
      } else {
        // Création
        result = await createStep(formData);
      }

      if (result.success) {
        onSave?.(result.data);
      } else {
        setFormError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const availableFieldsNotAdded = AVAILABLE_FIELDS.filter(
    f => !formData.required_fields.includes(f)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {stepData?.id ? 'Modifier Étape' : 'Nouvelle Étape'}
        </h2>
      </div>

      {/* Erreurs */}
      {(formError || error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {formError || error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Numéro et Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Numéro d'étape *
          </label>
          <input
            type="number"
            name="step_number"
            min="1"
            value={formData.step_number}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom de l'étape *
          </label>
          <input
            type="text"
            name="step_name"
            value={formData.step_name}
            onChange={handleInputChange}
            placeholder="Ex: Vérification identité"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Description de l'étape..."
          rows="3"
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Type d'étape */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type d'étape
          </label>
          <select
            name="step_type"
            value={formData.step_type}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {STEP_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Durée estimée */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Durée estimée (min)
          </label>
          <input
            type="number"
            name="estimated_duration_minutes"
            min="0"
            value={formData.estimated_duration_minutes}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Actif */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Actif</span>
          </label>
        </div>
      </div>

      {/* Champs requis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Champs requis
        </label>

        <div className="flex gap-2 mb-3">
          <select
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Sélectionner un champ...</option>
            {availableFieldsNotAdded.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddField}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter
          </button>
        </div>

        {/* Champs ajoutés */}
        {formData.required_fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.required_fields.map(field => (
              <div
                key={field}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
              >
                <span className="text-sm">{field}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveField(field)}
                  className="text-blue-700 hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
