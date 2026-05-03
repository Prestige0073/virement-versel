-- ============================================
-- SEED DATA - Données de test
-- À ne pas utiliser en production
-- ============================================

-- NOTE: Les user_id doivent être remplacés par des UUIDs réels créés via Supabase Auth
-- Ceci est un exemple de structure

-- Exemple de compte bancaire (remplacer user_id)
-- INSERT INTO bank_accounts (
--   user_id, holder_name, holder_email, phone, address,
--   iban, bic, bank_name, branch, account_type,
--   tier, currency, opening_date, current_balance, language
-- ) VALUES (
--   'USER_UUID_HERE', 
--   'Jean Dupont',
--   'jean@example.com',
--   '+33612345678',
--   '123 Rue de la Paix, 75000 Paris',
--   'FR1420041010050500013M02606',
--   'BNPAFRPP',
--   'BNP Paribas',
--   'Paris Centre',
--   'courant',
--   'premium',
--   'EUR',
--   '2026-01-01',
--   5000.00,
--   'fr'
-- );

-- Exemple d'étapes de virement
-- INSERT INTO transfer_steps_config (
--   bank_account_id, step_order, step_type, step_label_custom, unlock_code_encrypted
-- ) VALUES
-- ('ACCOUNT_UUID_HERE', 1, 'otp', 'Code OTP', 'encrypted_code_here'),
-- ('ACCOUNT_UUID_HERE', 2, 'swift', 'Code SWIFT', 'encrypted_code_here'),
-- ('ACCOUNT_UUID_HERE', 3, 'aml', 'Vérification AML', 'encrypted_code_here');

-- ============================================
-- Données de test pour phases suivantes
-- ============================================

-- Les données seront insérées via API et tests, pas manually

-- AUDIT SEED DATA:
-- - Pas de données sensibles en plain text
-- - Codes chiffrés ne doivent jamais être committes
-- - Utiliser des variables d'environnement pour données test
