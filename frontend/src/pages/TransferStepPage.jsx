import React, { useState, useEffect } from 'react';
import { useTransferStep } from '../hooks/useTransferStep';
import TransferStepForm from '../components/TransferStepForm';

/**
 * TransferStepPage - Page de gestion des étapes de virement
 * Affiche: Liste des étapes, recherche, création, édition, suppression
 */
export default function TransferStepPage() {
  const {
    steps,
    loading,
    error,
    createStep,
    updateStep,
    deleteStep,
    getSteps,
  } = useTransferStep();

  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('step_number');

  const STEP_TYPES = {
    verification: 'Vérification',
    approval: 'Approbation',
    notification: 'Notification',
    payment: 'Paiement',
  };

  // Charger les étapes avec filtres
  useEffect(() => {
    const loadSteps = async () => {
      const filters = {};
      if (filterType) filters.stepType = filterType;
      await getSteps(filters);
    };
    loadSteps();
  }, [filterType, getSteps]);

  // Filtrer et trier les étapes
  const filteredSteps = steps
    .filter(step => {
      if (searchTerm) {
        return (
          step.step_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          step.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'step_number') return a.step_number - b.step_number;
      if (sortBy === 'name') return a.step_name.localeCompare(b.step_name);
      return 0;
    });

  const handleCreateNew = () => {
    setEditingStep(null);
    setShowForm(true);
  };

  const handleEdit = (step) => {
    setEditingStep(step);
    setShowForm(true);
  };

  const handleDelete = async (stepId) => {
    const result = await deleteStep(stepId);
    if (result.success) {
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveStep = (stepData) => {
    setShowForm(false);
    setEditingStep(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStep(null);
  };

  // Afficher le formulaire si en création/édition
  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <TransferStepForm
            stepData={editingStep}
            onSave={handleSaveStep}
            onCancel={handleCloseForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Étapes de Virement</h1>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nouvelle Étape
            </button>
          </div>
          <p className="text-gray-600">Configurez les étapes d'un processus de virement</p>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher une étape..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tous les types</option>
            {Object.entries(STEP_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="step_number">Par numéro</option>
            <option value="name">Par nom</option>
          </select>
        </div>

        {/* Liste des étapes */}
        {filteredSteps.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">Aucune étape configurée</p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer la première étape
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSteps.map(step => (
              <div
                key={step.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                      {step.step_number}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {step.step_name}
                      </h3>
                      {step.description && (
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(step)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(step.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Badges d'infos */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {STEP_TYPES[step.step_type] || step.step_type}
                  </span>
                  {!step.is_active && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                      Inactif
                    </span>
                  )}
                  {step.estimated_duration_minutes > 0 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      ~{step.estimated_duration_minutes} min
                    </span>
                  )}
                </div>

                {/* Champs requis */}
                {step.required_fields && step.required_fields.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Champs requis:</p>
                    <div className="flex flex-wrap gap-2">
                      {step.required_fields.map(field => (
                        <span
                          key={field}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation suppression */}
                {showDeleteConfirm === step.id && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700 mb-2">
                      Êtes-vous sûr de vouloir supprimer cette étape?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(step.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* État de chargement */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        )}
      </div>
    </div>
  );
}
