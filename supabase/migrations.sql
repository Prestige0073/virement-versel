-- ============================================
-- PHASE 1-4: Initialisation de la Base de Données
-- ============================================
-- Tables pour le système de virement bancaire

-- ============================================
-- 1. TABLE: bank_accounts
-- Comptes bancaires fictifs créés par les utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  holder_name VARCHAR(100) NOT NULL,
  holder_email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  
  -- Informations bancaires
  iban VARCHAR(34) NOT NULL UNIQUE,
  bic VARCHAR(11),
  bank_name VARCHAR(100) NOT NULL,
  branch VARCHAR(100),
  account_type VARCHAR(50), -- 'courant', 'épargne', 'pro', 'business'
  
  -- Configuration
  tier VARCHAR(20) NOT NULL, -- 'basique', 'premium', 'vip'
  currency VARCHAR(3) DEFAULT 'XOF', -- devise
  bank_logo_url VARCHAR(255),
  opening_date DATE,
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  language VARCHAR(5) DEFAULT 'fr',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_balance CHECK (current_balance >= 0)
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);

-- ============================================
-- 2. TABLE: transfer_steps_config
-- Configuration des étapes de virement
-- ============================================
CREATE TABLE IF NOT EXISTS transfer_steps_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL, -- 1, 2, 3...
  step_type VARCHAR(50) NOT NULL, -- 'otp', 'swift', 'aml', 'fraud', 'fees', 'manager', '3d_secure', etc.
  step_label_custom VARCHAR(200), -- étiquette personnalisée
  
  -- Code de déblocage (chiffré en application)
  unlock_code_encrypted TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_order CHECK (step_order > 0),
  UNIQUE(bank_account_id, step_order)
);

CREATE INDEX idx_transfer_steps_config_account ON transfer_steps_config(bank_account_id);

-- ============================================
-- 3. TABLE: share_links
-- Liens sécurisés vers l'espace client
-- ============================================
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  slug VARCHAR(50) UNIQUE NOT NULL, -- URL slug unique
  password_hash VARCHAR(255) NOT NULL, -- hash du mot de passe
  
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = jamais expire
  is_active BOOLEAN DEFAULT TRUE,
  
  access_count INTEGER DEFAULT 0, -- nombre d'accès
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9]+$')
);

CREATE INDEX idx_share_links_slug ON share_links(slug);
CREATE INDEX idx_share_links_account ON share_links(bank_account_id);

-- ============================================
-- 4. TABLE: transfers
-- Virements effectués via l'espace client
-- ============================================
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE SET NULL,
  
  -- Infos bénéficiaire
  recipient_name VARCHAR(100) NOT NULL,
  recipient_iban VARCHAR(34) NOT NULL,
  recipient_bic VARCHAR(11),
  recipient_bank VARCHAR(100),
  
  -- Montant et devise
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  motif VARCHAR(200),
  
  -- Statut
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'cancelled'
  current_step INTEGER DEFAULT 1,
  
  -- Références
  transaction_reference VARCHAR(50) UNIQUE, -- ex: TRX-20260428-A7B3K9
  pdf_url VARCHAR(255),
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'cancelled'))
);

CREATE INDEX idx_transfers_account ON transfers(bank_account_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_ref ON transfers(transaction_reference);

-- ============================================
-- 5. TABLE: transfer_step_attempts
-- Suivi de chaque tentative d'étape
-- ============================================
CREATE TABLE IF NOT EXISTS transfer_step_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  
  step_order INTEGER NOT NULL,
  
  code_requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  code_validated_by_owner_at TIMESTAMP WITH TIME ZONE,
  code_entered_by_client_at TIMESTAMP WITH TIME ZONE,
  
  success BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_order CHECK (step_order > 0)
);

CREATE INDEX idx_step_attempts_transfer ON transfer_step_attempts(transfer_id);

-- ============================================
-- 6. TABLE: realtime_events
-- Événements temps réel pour notifications
-- ============================================
CREATE TABLE IF NOT EXISTS realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  -- Types: 'client_connected', 'transfer_started', 'code_requested', 
  -- 'step_unlocked', 'transfer_completed', 'client_disconnected'
  
  payload JSONB, -- données additionnelles
  
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'client_connected', 'transfer_started', 'code_requested',
      'step_unlocked', 'transfer_completed', 'client_disconnected',
      'transfer_failed'
    )
  )
);

CREATE INDEX idx_events_account ON realtime_events(bank_account_id);
CREATE INDEX idx_events_created ON realtime_events(created_at DESC);
CREATE INDEX idx_events_unread ON realtime_events(read) WHERE read = FALSE;

-- ============================================
-- 7. TABLE: audit_logs
-- Logs d'audit pour sécurité
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  changes JSONB, -- avant/après
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_account ON audit_logs(bank_account_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- Permissions Row-Level Security (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_steps_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_step_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;

-- Policies pour bank_accounts
CREATE POLICY "Users can view own bank accounts"
  ON bank_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts"
  ON bank_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
  ON bank_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour transfer_steps_config
CREATE POLICY "Users can view steps of their accounts"
  ON transfer_steps_config FOR SELECT
  USING (
    bank_account_id IN (
      SELECT id FROM bank_accounts WHERE user_id = auth.uid()
    )
  );

-- Policies pour realtime_events
CREATE POLICY "Users can view events of their accounts"
  ON realtime_events FOR SELECT
  USING (
    bank_account_id IN (
      SELECT id FROM bank_accounts WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour générer une référence de transaction unique
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON bank_accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================
-- Fin des migrations Phase 1-4
-- ============================================
