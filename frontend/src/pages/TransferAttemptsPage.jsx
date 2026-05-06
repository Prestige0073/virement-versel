import React, { useState, useEffect, useCallback } from 'react';
import { useTransferAttempt } from '../hooks/useTransferAttempt';
import { StepExecutor } from '../utils/StepExecutor';

/**
 * TransferAttemptsPage Component
 * 
 * Displays active and completed transfer attempts with:
 * - Real-time progress tracking
 * - Step-by-step execution history
 * - Status indicators
 * - Execution timeline
 * - Cancel/retry actions
 */

export default function TransferAttemptsPage() {
  const { attempts, currentAttempt, getAttempts, cancelAttempt, loading, error } = useTransferAttempt();
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [sort, setSort] = useState('recent');
  const [cancelError, setCancelError] = useState(null);

  // Load attempts on mount
  useEffect(() => {
    const loadAttempts = async () => {
      await getAttempts();
    };
    loadAttempts();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...attempts];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Sort
    if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setFilteredAttempts(filtered);
  }, [attempts, filterStatus, sort]);

  // Handle attempt cancellation
  const handleCancelAttempt = useCallback(async (attemptId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette tentative ?')) {
      return;
    }

    setCancelError(null);
    try {
      await cancelAttempt(attemptId, 'Annulée par l\'utilisateur');
      setSelectedAttempt(null);
    } catch (err) {
      setCancelError(err.message || 'Erreur en annulation de tentative');
    }
  }, [cancelAttempt]);

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'step_in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      started: 'Démarrée',
      step_in_progress: 'Étape en cours',
      completed: 'Complétée',
      failed: 'Échouée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleString('fr-FR');
  };

  // Calculate progress percentage
  const getProgressPercentage = (attempt, totalSteps) => {
    if (!totalSteps || totalSteps === 0) return 0;
    const completed = attempt.completed_steps.length + attempt.skipped_steps.length;
    return Math.round((completed / totalSteps) * 100);
  };

  if (loading && filteredAttempts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement des tentatives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tentatives de Virement</h1>
            <p className="text-gray-600 mt-2">Suivi des virements en cours d'exécution</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{filteredAttempts.length}</div>
            <p className="text-gray-600">tentatives</p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Erreur: {error}</p>
          </div>
        )}

        {cancelError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Erreur: {cancelError}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="started">Démarrée</option>
              <option value="step_in_progress">Étape en cours</option>
              <option value="completed">Complétée</option>
              <option value="failed">Échouée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tri
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Plus récents en premier</option>
              <option value="oldest">Plus anciens en premier</option>
            </select>
          </div>
        </div>

        {/* Empty state */}
        {filteredAttempts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Aucune tentative trouvée</p>
            <p className="text-gray-500 text-sm">
              {filterStatus === 'all'
                ? 'Commencez un nouveau virement pour créer une tentative'
                : `Aucune tentative avec le statut "${getStatusLabel(filterStatus)}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attempts list */}
            <div className="lg:col-span-2 space-y-4">
              {filteredAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  onClick={() => setSelectedAttempt(attempt)}
                  className={`p-6 bg-white border rounded-lg cursor-pointer transition-all ${
                    selectedAttempt?.id === attempt.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Virement #{attempt.id.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatTime(attempt.created_at)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        attempt.status
                      )}`}
                    >
                      {getStatusLabel(attempt.status)}
                    </span>
                  </div>

                  {/* Transfer info */}
                  <div className="bg-gray-50 p-4 rounded mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-semibold">
                        {attempt.transfer_data.amount} {attempt.transfer_data.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Titulaire:</span>
                      <span className="font-medium">{attempt.transfer_data.holder_name}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  {['started', 'step_in_progress'].includes(attempt.status) && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progression</span>
                        <span className="text-sm text-gray-600">
                          {attempt.completed_steps.length + attempt.skipped_steps.length} étapes
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.max(
                              1,
                              ((attempt.completed_steps.length + attempt.skipped_steps.length) / 10) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Current step */}
                  {attempt.current_step && (
                    <div className="bg-blue-50 p-3 rounded text-sm">
                      <p className="text-blue-900">
                        <span className="font-semibold">Étape en cours:</span>{' '}
                        {attempt.current_step.name}
                      </p>
                    </div>
                  )}

                  {/* Error display */}
                  {attempt.errors.length > 0 && (
                    <div className="bg-red-50 p-3 rounded text-sm mt-4">
                      <p className="text-red-900 font-semibold mb-2">Erreur:</p>
                      <p className="text-red-800">{attempt.errors[0].message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selectedAttempt && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Détails</h2>
                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Status */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Statut</p>
                  <p className="font-semibold text-gray-900">
                    {getStatusLabel(selectedAttempt.status)}
                  </p>
                </div>

                {/* Transfer amount */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Montant</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedAttempt.transfer_data.amount} {selectedAttempt.transfer_data.currency}
                  </p>
                </div>

                {/* Timeline */}
                {selectedAttempt.step_history.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Historique</p>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedAttempt.step_history.map((entry, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                entry.status === 'completed'
                                  ? 'bg-green-500'
                                  : entry.status === 'failed'
                                  ? 'bg-red-500'
                                  : 'bg-gray-300'
                              }`}
                            ></div>
                            {idx !== selectedAttempt.step_history.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-300"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {entry.status === 'completed'
                                ? 'Complétée'
                                : entry.status === 'failed'
                                ? 'Échouée'
                                : 'Ignorée'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatTime(entry.timestamp || entry.started_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration if completed */}
                {selectedAttempt.completed_at && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Temps total</p>
                    <p className="font-semibold text-gray-900">
                      {Math.round(
                        (new Date(selectedAttempt.completed_at) - new Date(selectedAttempt.created_at)) / 1000
                      )}{' '}
                      secondes
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                {['started', 'step_in_progress'].includes(selectedAttempt.status) && (
                  <button
                    onClick={() => handleCancelAttempt(selectedAttempt.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Annuler la tentative
                  </button>
                )}

                {selectedAttempt.status === 'failed' && (
                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled
                  >
                    Réessayer (À venir)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
