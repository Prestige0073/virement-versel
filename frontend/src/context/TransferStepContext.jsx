import React, { createContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { isRateLimited } from '../utils/rateLimiter';
import { sanitizeString, getSafeErrorMessage } from '../utils/sanitizer';

/**
 * TransferStepContext - Gère les étapes de configuration de virement
 * CRUD operations pour transfer_steps_config table
 * Security: Rate limiting, input sanitization
 */
export const TransferStepContext = createContext(null);

export const TransferStepProvider = ({ children }) => {
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les étapes au démarrage
   */
  useEffect(() => {
    const initSteps = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setSteps([]);
          return;
        }

        const { data, error: queryError } = await supabase
          .from('transfer_steps_config')
          .select('*')
          .eq('user_id', user.id)
          .order('step_number', { ascending: true });

        if (queryError) throw queryError;
        setSteps(data || []);
      } catch (err) {
        console.error('Init steps error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initSteps();
  }, []);

  /**
   * Créer une nouvelle étape de virement
   * Security: Rate limited (max 10/min)
   */
  const createStep = useCallback(async (stepData) => {
    try {
      if (isRateLimited('transfer-step-create', 10, 60000)) {
        throw new Error('Trop de requêtes. Réessayez dans 1 minute.');
      }

      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      // Validation
      if (!stepData.step_number || stepData.step_number < 1) {
        throw new Error('Numéro d\'étape invalide (minimum 1)');
      }

      if (!stepData.step_name || stepData.step_name.length < 2) {
        throw new Error('Nom d\'étape requis (minimum 2 caractères)');
      }

      if (stepData.required_fields && !Array.isArray(stepData.required_fields)) {
        throw new Error('Les champs requis doivent être un tableau');
      }

      // Sanitize inputs
      const sanitized = {
        user_id: user.id,
        step_number: Math.floor(stepData.step_number),
        step_name: sanitizeString(stepData.step_name).substring(0, 100),
        description: sanitizeString(stepData.description || '').substring(0, 500),
        required_fields: (stepData.required_fields || []).map(f => sanitizeString(f)),
        validations: stepData.validations || {},
        conditions: stepData.conditions || {},
        step_type: ['verification', 'approval', 'notification', 'payment'].includes(stepData.step_type)
          ? stepData.step_type
          : 'verification',
        is_active: stepData.is_active !== false,
        estimated_duration_minutes: Math.max(0, Math.floor(stepData.estimated_duration_minutes || 0)),
      };

      // Check for duplicate step_number
      const { data: existing } = await supabase
        .from('transfer_steps_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('step_number', sanitized.step_number)
        .single();

      if (existing) {
        throw new Error(`Une étape avec le numéro ${sanitized.step_number} existe déjà`);
      }

      const { data, error: insertError } = await supabase
        .from('transfer_steps_config')
        .insert([sanitized])
        .select();

      if (insertError) throw insertError;

      setSteps(prev => [...prev, data[0]].sort((a, b) => a.step_number - b.step_number));
      return { success: true, data: data[0] };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Create step error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupérer une étape spécifique
   */
  const getStep = useCallback(async (stepId) => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('transfer_steps_config')
        .select('*')
        .eq('id', stepId)
        .single();

      if (queryError) throw queryError;

      setSelectedStep(data);
      return { success: true, data };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Get step error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour une étape
   * Security: Rate limited (max 15/min)
   */
  const updateStep = useCallback(async (stepId, updates) => {
    try {
      if (isRateLimited('transfer-step-update', 15, 60000)) {
        throw new Error('Trop de mise à jour. Réessayez plus tard.');
      }

      setError(null);
      setLoading(true);

      // Sanitize inputs
      const sanitized = {};

      if (updates.step_name !== undefined) {
        if (updates.step_name.length < 2) {
          throw new Error('Nom d\'étape requis (minimum 2 caractères)');
        }
        sanitized.step_name = sanitizeString(updates.step_name).substring(0, 100);
      }

      if (updates.description !== undefined) {
        sanitized.description = sanitizeString(updates.description).substring(0, 500);
      }

      if (updates.required_fields !== undefined) {
        if (!Array.isArray(updates.required_fields)) {
          throw new Error('Les champs requis doivent être un tableau');
        }
        sanitized.required_fields = updates.required_fields.map(f => sanitizeString(f));
      }

      if (updates.validations !== undefined) {
        sanitized.validations = updates.validations;
      }

      if (updates.conditions !== undefined) {
        sanitized.conditions = updates.conditions;
      }

      if (updates.step_type !== undefined) {
        if (!['verification', 'approval', 'notification', 'payment'].includes(updates.step_type)) {
          throw new Error('Type d\'étape invalide');
        }
        sanitized.step_type = updates.step_type;
      }

      if (updates.is_active !== undefined) {
        sanitized.is_active = updates.is_active === true;
      }

      if (updates.estimated_duration_minutes !== undefined) {
        sanitized.estimated_duration_minutes = Math.max(0, Math.floor(updates.estimated_duration_minutes));
      }

      const { data, error: updateError } = await supabase
        .from('transfer_steps_config')
        .update(sanitized)
        .eq('id', stepId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSteps(prev =>
        prev.map(s => s.id === stepId ? data : s).sort((a, b) => a.step_number - b.step_number)
      );

      if (selectedStep?.id === stepId) {
        setSelectedStep(data);
      }

      return { success: true, data };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Update step error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [selectedStep]);

  /**
   * Supprimer une étape
   * Security: Rate limited (max 5/min)
   */
  const deleteStep = useCallback(async (stepId) => {
    try {
      if (isRateLimited('transfer-step-delete', 5, 60000)) {
        throw new Error('Trop de suppressions. Réessayez plus tard.');
      }

      setError(null);
      setLoading(true);

      // Check if this step has any active transfers using it
      const { data: activeTransfers, error: checkError } = await supabase
        .from('transfer_step_attempts')
        .select('id')
        .eq('step_id', stepId)
        .eq('status', 'in_progress')
        .limit(1);

      if (checkError) throw checkError;

      if (activeTransfers && activeTransfers.length > 0) {
        throw new Error('Impossible de supprimer: cette étape est actuellement utilisée');
      }

      const { error: deleteError } = await supabase
        .from('transfer_steps_config')
        .delete()
        .eq('id', stepId);

      if (deleteError) throw deleteError;

      setSteps(prev => prev.filter(s => s.id !== stepId));

      if (selectedStep?.id === stepId) {
        setSelectedStep(null);
      }

      return { success: true };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Delete step error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [selectedStep]);

  /**
   * Obtenir les étapes avec filtres
   */
  const getSteps = useCallback(async (filters = {}) => {
    try {
      setLoading(true);

      let query = supabase
        .from('transfer_steps_config')
        .select('*');

      if (filters.stepType) {
        query = query.eq('step_type', filters.stepType);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error: queryError } = await query.order('step_number', { ascending: true });

      if (queryError) throw queryError;

      return { success: true, data };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Réordonner les étapes
   */
  const reorderSteps = useCallback(async (stepUpdates) => {
    try {
      if (isRateLimited('transfer-step-reorder', 5, 60000)) {
        throw new Error('Trop de réorganisations. Réessayez plus tard.');
      }

      setError(null);
      setLoading(true);

      // stepUpdates: Array of { id, new_step_number }
      const updates = stepUpdates.map(update => ({
        id: update.id,
        step_number: Math.floor(update.new_step_number),
      }));

      // Update all steps
      const promises = updates.map(update =>
        supabase
          .from('transfer_steps_config')
          .update({ step_number: update.step_number })
          .eq('id', update.id)
      );

      await Promise.all(promises);

      // Reload steps
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error: queryError } = await supabase
        .from('transfer_steps_config')
        .select('*')
        .eq('user_id', user.id)
        .order('step_number', { ascending: true });

      if (queryError) throw queryError;
      setSteps(data || []);

      return { success: true, data };
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setError(message);
      console.error('Reorder steps error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // État
    steps,
    selectedStep,
    loading,
    error,

    // Méthodes
    createStep,
    getStep,
    updateStep,
    deleteStep,
    getSteps,
    reorderSteps,
    setSelectedStep,
    clearError,
  };

  return (
    <TransferStepContext.Provider value={value}>
      {children}
    </TransferStepContext.Provider>
  );
};
