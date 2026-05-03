/**
 * Transfer Steps API Routes
 * Endpoints pour gérer les configurations d'étapes de virement
 * Base URL: /api/transfer-steps
 */

import { Router } from 'express';
import { auth } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/transfer-steps
 * Créer une nouvelle étape de virement
 * Auth: Required
 */
router.post('/api/transfer-steps', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      step_number,
      step_name,
      description,
      step_type,
      required_fields,
      validations,
      conditions,
      is_active,
      estimated_duration_minutes,
    } = req.body;

    // Validation
    if (!step_number || step_number < 1) {
      return res.status(400).json({ error: 'Numéro d\'étape invalide' });
    }

    if (!step_name || step_name.length < 2) {
      return res.status(400).json({ error: 'Nom d\'étape requis' });
    }

    // Check for duplicate step_number
    const { data: existing } = await supabase
      .from('transfer_steps_config')
      .select('id')
      .eq('user_id', userId)
      .eq('step_number', step_number)
      .single();

    if (existing) {
      return res
        .status(400)
        .json({ error: `Une étape avec le numéro ${step_number} existe déjà` });
    }

    // Créer l'étape
    const { data, error } = await supabase
      .from('transfer_steps_config')
      .insert([{
        user_id: userId,
        step_number,
        step_name,
        description: description || '',
        step_type: step_type || 'verification',
        required_fields: required_fields || [],
        validations: validations || {},
        conditions: conditions || {},
        is_active: is_active !== false,
        estimated_duration_minutes: estimated_duration_minutes || 0,
      }])
      .select();

    if (error) throw error;

    // Log audit
    await logAuditEvent(userId, 'TRANSFER_STEP_CREATED', {
      step_id: data[0].id,
      step_number: data[0].step_number,
    });

    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error('Create step error:', err);
    res.status(500).json({ error: 'Erreur création étape' });
  }
});

/**
 * GET /api/transfer-steps
 * Lister les étapes de l'utilisateur
 * Params: step_type, is_active
 * Auth: Required
 */
router.get('/api/transfer-steps', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { step_type, is_active } = req.query;

    let query = supabase
      .from('transfer_steps_config')
      .select('*')
      .eq('user_id', userId);

    if (step_type) {
      query = query.eq('step_type', step_type);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query.order('step_number', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('List steps error:', err);
    res.status(500).json({ error: 'Erreur récupération étapes' });
  }
});

/**
 * GET /api/transfer-steps/:id
 * Récupérer une étape spécifique
 * Auth: Required
 */
router.get('/api/transfer-steps/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transfer_steps_config')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Étape non trouvée' });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get step error:', err);
    res.status(500).json({ error: 'Erreur récupération étape' });
  }
});

/**
 * PATCH /api/transfer-steps/:id
 * Mettre à jour une étape
 * Auth: Required
 */
router.patch('/api/transfer-steps/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    // Vérifier l'ownership
    const { data: existing } = await supabase
      .from('transfer_steps_config')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Étape non trouvée' });
    }

    // Mettre à jour
    const { data, error } = await supabase
      .from('transfer_steps_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await logAuditEvent(userId, 'TRANSFER_STEP_UPDATED', {
      step_id: id,
      changes: Object.keys(updates),
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Update step error:', err);
    res.status(500).json({ error: 'Erreur mise à jour étape' });
  }
});

/**
 * DELETE /api/transfer-steps/:id
 * Supprimer une étape
 * Vérifie qu'aucun transfer actif l'utilise
 * Auth: Required
 */
router.delete('/api/transfer-steps/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Vérifier l'ownership
    const { data: existing } = await supabase
      .from('transfer_steps_config')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Étape non trouvée' });
    }

    // Vérifier qu'aucun transfer actif l'utilise
    const { data: activeAttempts } = await supabase
      .from('transfer_step_attempts')
      .select('id')
      .eq('step_id', id)
      .eq('status', 'in_progress')
      .limit(1);

    if (activeAttempts && activeAttempts.length > 0) {
      return res
        .status(400)
        .json({ error: 'Impossible de supprimer: étape actuellement utilisée' });
    }

    // Supprimer
    const { error } = await supabase
      .from('transfer_steps_config')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await logAuditEvent(userId, 'TRANSFER_STEP_DELETED', {
      step_id: id,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete step error:', err);
    res.status(500).json({ error: 'Erreur suppression étape' });
  }
});

/**
 * POST /api/transfer-steps/reorder
 * Réorganiser les numéros d'étapes
 * Body: { updates: [{ id, new_step_number }, ...] }
 * Auth: Required
 */
router.post('/api/transfer-steps/reorder', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates doit être un tableau' });
    }

    // Update all steps
    for (const update of updates) {
      await supabase
        .from('transfer_steps_config')
        .update({ step_number: update.new_step_number })
        .eq('id', update.id)
        .eq('user_id', userId);
    }

    // Log audit
    await logAuditEvent(userId, 'TRANSFER_STEPS_REORDERED', {
      count: updates.length,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Reorder steps error:', err);
    res.status(500).json({ error: 'Erreur réorganisation étapes' });
  }
});

/**
 * Helper: Log audit event
 */
async function logAuditEvent(userId, action, details = {}) {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      resource_type: 'transfer_step',
      details,
      ip_address: '0.0.0.0', // À obtenir du request
      timestamp: new Date().toISOString(),
    }]);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export default router;
