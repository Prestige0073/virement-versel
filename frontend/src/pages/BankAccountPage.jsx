import { useState, useEffect } from 'react';
import { useBankAccount } from '../hooks/useBankAccount';
import { useAuth } from '../hooks/useAuth';
import BankAccountForm from '../components/BankAccountForm';
import SimulationBanner from '../components/SimulationBanner';

/**
 * BankAccountPage - Gestion des comptes bancaires (CRUD)
 * Créer, lire, modifier, supprimer des comptes bancaires
 */
function BankAccountPage() {
  const { user } = useAuth();
  const {
    accounts,
    selectedAccount,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccount,
    setSelectedAccount,
    clearError,
  } = useBankAccount();

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  /**
   * Filtrer les comptes
   */
  const filteredAccounts = accounts.filter(account => {
    let matches = true;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      matches = account.holder_name.toLowerCase().includes(search) ||
                account.bank_name.toLowerCase().includes(search) ||
                account.iban.includes(search);
    }

    if (filterType !== 'all') {
      matches = matches && account.account_type === filterType;
    }

    return matches;
  });

  /**
   * Ouvrir formulaire création
   */
  const handleCreateNew = () => {
    setFormMode('create');
    setEditingId(null);
    setSelectedAccount(null);
    setShowForm(true);
    clearError();
  };

  /**
   * Ouvrir formulaire édition
   */
  const handleEdit = async (accountId) => {
    setFormMode('edit');
    setEditingId(accountId);
    const result = await getAccount(accountId);
    if (result.success) {
      setShowForm(true);
      clearError();
    }
  };

  /**
   * Supprimer un compte (avec confirmation)
   */
  const handleDelete = async (accountId) => {
    if (confirmDelete !== accountId) {
      setConfirmDelete(accountId);
      return;
    }

    const result = await deleteAccount(accountId);
    if (result.success) {
      setConfirmDelete(null);
      // Success notification
    }
  };

  /**
   * Soumettre le formulaire
   */
  const handleFormSubmit = (accountData) => {
    setShowForm(false);
    setEditingId(null);
    setFormMode('create');
    // Recharger la liste
  };

  /**
   * Fermer le formulaire
   */
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormMode('create');
    clearError();
  };

  /**
   * Afficher les détails d'un compte
   */
  const handleViewDetails = (account) => {
    setSelectedAccount(account);
  };

  if (showForm) {
    return (
      <>
        <SimulationBanner />
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-8">
                <button
                  onClick={handleFormCancel}
                  className="text-primary-600 hover:text-primary-700 font-semibold mb-4"
                >
                  ← Retour à la liste
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                  {formMode === 'edit' ? '✏️ Modifier le Compte' : '✨ Créer un Nouveau Compte'}
                </h1>
              </div>

              <BankAccountForm
                accountId={editingId}
                onSuccess={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💳 Mes Comptes Bancaires
            </h1>
            <p className="text-gray-600">
              Gérez vos comptes bancaires fictifs
            </p>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  🔍 Rechercher
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, banque, IBAN..."
                  className="input-field w-full"
                />
              </div>

              {/* Filtre Type */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  📋 Type de Compte
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">Tous</option>
                  <option value="courant">Courant</option>
                  <option value="épargne">Épargne</option>
                  <option value="pro">Professionnel</option>
                  <option value="business">Entreprise</option>
                </select>
              </div>

              {/* Bouton Créer */}
              <div className="flex items-end">
                <button
                  onClick={handleCreateNew}
                  className="btn btn-primary w-full"
                >
                  ➕ Nouveau Compte
                </button>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-danger-50 border border-danger-300 text-danger-800 px-4 py-3 rounded-lg mb-8">
              ✗ {error}
            </div>
          )}

          {/* État vide */}
          {accounts.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-5xl mb-4">🏦</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Aucun compte créé
              </h2>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre premier compte bancaire fictif
              </p>
              <button
                onClick={handleCreateNew}
                className="btn btn-primary inline-block"
              >
                ➕ Créer mon Premier Compte
              </button>
            </div>
          )}

          {/* Liste des comptes */}
          {filteredAccounts.length > 0 && (
            <div className="grid gap-6">
              {filteredAccounts.map(account => (
                <div
                  key={account.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header de la carte */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {account.bank_logo_url && (
                          <img
                            src={account.bank_logo_url}
                            alt={account.bank_name}
                            className="h-12 w-12 object-contain"
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {account.holder_name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {account.bank_name} • {account.account_type}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          account.tier === 'vip' ? 'bg-yellow-100 text-yellow-800' :
                          account.tier === 'premium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {account.tier}
                        </span>
                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {account.currency}
                        </span>
                      </div>
                    </div>

                    {/* Infos financières */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-200">
                      <div>
                        <p className="text-gray-600 text-xs font-semibold mb-1">IBAN</p>
                        <p className="text-gray-900 font-mono text-sm break-all">
                          {account.iban}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold mb-1">BIC</p>
                        <p className="text-gray-900 font-mono text-sm">
                          {account.bic}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold mb-1">Solde Actuel</p>
                        <p className="text-primary-600 font-bold text-lg">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: account.currency,
                          }).format(account.current_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs font-semibold mb-1">Créé le</p>
                        <p className="text-gray-900 text-sm">
                          {new Date(account.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Email</p>
                        <p className="text-gray-900">{account.holder_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Téléphone</p>
                        <p className="text-gray-900">{account.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Adresse</p>
                        <p className="text-gray-900">{account.address}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Branche</p>
                        <p className="text-gray-900">{account.branch || '—'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(account)}
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        👁️ Détails
                      </button>
                      <button
                        onClick={() => handleEdit(account.id)}
                        disabled={loading}
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        disabled={loading || confirmDelete === account.id}
                        className={`flex-1 text-sm font-semibold py-2 px-4 rounded-lg transition-all ${
                          confirmDelete === account.id
                            ? 'bg-danger-600 text-white'
                            : 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                        }`}
                      >
                        {confirmDelete === account.id ? '⚠️ Confirmer' : '🗑️ Supprimer'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {searchTerm && filteredAccounts.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">
                Aucun compte trouvé pour "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default BankAccountPage;
