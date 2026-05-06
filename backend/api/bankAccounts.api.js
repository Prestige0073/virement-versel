/**
 * Backend API Routes - Bank Account Management
 * 
 * Implémenté côté serveur (Edge Functions Supabase ou Node.js backend)
 * CRUD operations pour les comptes bancaires (bank_accounts table)
 */

// ============================================
// CREATE - Créer un compte bancaire
// ============================================

/**
 * POST /api/bank-accounts
 * Créer un nouveau compte bancaire
 * 
 * Request:
 * {
 *   holder_name: "Jean Dupont",
 *   holder_email: "jean@example.com",
 *   phone: "628365841",
 *   address: "123 rue test",
 *   iban: "CI05A12345678901234567890",
 *   bic: "ABCDCI2X",
 *   bank_name: "Banque Atlantique",
 *   account_type: "courant",
 *   tier: "basique",
 *   currency: "XOF",
 *   current_balance: 1000000
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: { id, user_id, holder_name, ... }
 * }
 */
export const createBankAccount = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      holder_name, 
      holder_email, 
      phone, 
      address, 
      iban, 
      bic, 
      bank_name,
      branch,
      account_type,
      tier,
      currency,
      current_balance,
      language,
    } = req.body;

    // Validation
    if (!holder_name || !iban || !bank_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validation IBAN
    if (!validateIBAN(iban)) {
      return res.status(400).json({ error: 'Invalid IBAN format' });
    }

    // Vérifier unicité IBAN pour cet utilisateur
    const { data: existing } = await req.supabase
      .from('bank_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('iban', iban.toUpperCase())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'IBAN already exists for this user' });
    }

    const { data, error } = await req.supabase
      .from('bank_accounts')
      .insert([{
        user_id: user.id,
        holder_name,
        holder_email: holder_email || user.email,
        phone,
        address,
        iban: iban.toUpperCase(),
        bic: bic?.toUpperCase() || '',
        bank_name,
        branch: branch || '',
        account_type: account_type || 'courant',
        tier: tier || 'basique',
        currency: currency || 'XOF',
        current_balance: Math.max(0, current_balance || 0),
        language: language || 'fr',
      }])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await req.supabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'bank_account_created',
      entity_type: 'bank_account',
      entity_id: data.id,
      changes: { holder_name, bank_name },
    }]);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Create account error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// READ - Récupérer les comptes
// ============================================

/**
 * GET /api/bank-accounts
 * Récupérer tous les comptes de l'utilisateur
 * 
 * Query params (optionnel):
 * - account_type: filter by type
 * - tier: filter by tier
 * - search: search in holder_name, bank_name, iban
 */
export const getBankAccounts = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { account_type, tier, search } = req.query;

    let query = req.supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (account_type) {
      query = query.eq('account_type', account_type);
    }
    if (tier) {
      query = query.eq('tier', tier);
    }
    if (search) {
      query = query.or(
        `holder_name.ilike.%${search}%,bank_name.ilike.%${search}%,iban.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/bank-accounts/:id
 * Récupérer un compte spécifique
 */
export const getBankAccount = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { data, error } = await req.supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Account not found' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get account error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// UPDATE - Mettre à jour un compte
// ============================================

/**
 * PATCH /api/bank-accounts/:id
 * Mettre à jour un compte bancaire
 */
export const updateBankAccount = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Validation IBAN si modifié
    if (updates.iban && !validateIBAN(updates.iban)) {
      return res.status(400).json({ error: 'Invalid IBAN format' });
    }

    // Convertir en majuscules
    if (updates.iban) updates.iban = updates.iban.toUpperCase();
    if (updates.bic) updates.bic = updates.bic.toUpperCase();

    // Vérifier que c'est le compte de l'utilisateur
    const { data: account, error: checkError } = await req.supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await req.supabase
      .from('bank_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await req.supabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'bank_account_updated',
      entity_type: 'bank_account',
      entity_id: id,
      changes: updates,
    }]);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// DELETE - Supprimer un compte
// ============================================

/**
 * DELETE /api/bank-accounts/:id
 * Supprimer un compte bancaire
 */
export const deleteBankAccount = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Vérifier que c'est le compte de l'utilisateur
    const { data: account, error: checkError } = await req.supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Vérifier qu'il n'y a pas de transfers actifs
    const { data: activeTransfers } = await req.supabase
      .from('transfers')
      .select('id')
      .eq('bank_account_id', id)
      .in('status', ['initiated', 'processing', 'pending']);

    if (activeTransfers && activeTransfers.length > 0) {
      return res.status(400).json({ error: 'Cannot delete: active transfers exist' });
    }

    const { error } = await req.supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await req.supabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'bank_account_deleted',
      entity_type: 'bank_account',
      entity_id: id,
      changes: { deleted: true },
    }]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// BALANCE - Mettre à jour le solde
// ============================================

/**
 * PATCH /api/bank-accounts/:id/balance
 * Mettre à jour le solde d'un compte
 * 
 * Request:
 * {
 *   new_balance: 5000000,
 *   reason: "Operacion transfer" (optional)
 * }
 */
export const updateBankBalance = async (req, res) => {
  try {
    const { data: { user } } = await req.supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { new_balance, reason } = req.body;

    if (new_balance === undefined || new_balance < 0) {
      return res.status(400).json({ error: 'Invalid balance' });
    }

    // Vérifier que c'est le compte de l'utilisateur
    const { data: account } = await req.supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await req.supabase
      .from('bank_accounts')
      .update({ current_balance: new_balance })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await req.supabase.from('audit_logs').insert([{
      user_id: user.id,
      action: 'bank_balance_updated',
      entity_type: 'bank_account',
      entity_id: id,
      changes: { 
        old_balance: account.current_balance, 
        new_balance,
        reason,
      },
    }]);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Update balance error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Validation IBAN
 */
const validateIBAN = (iban) => {
  if (!iban) return false;
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(iban.toUpperCase());
};
