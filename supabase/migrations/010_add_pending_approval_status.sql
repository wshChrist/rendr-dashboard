-- Ajouter le statut 'pending_approval' pour les comptes en attente d'approbation admin

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.trading_accounts 
DROP CONSTRAINT IF EXISTS trading_accounts_status_check;

-- Ajouter la nouvelle contrainte avec 'pending_approval'
ALTER TABLE public.trading_accounts 
ADD CONSTRAINT trading_accounts_status_check 
CHECK (status IN ('pending_approval', 'pending_vps_setup', 'connected', 'error', 'disconnected'));

-- Index pour améliorer les performances des requêtes d'approbation
CREATE INDEX IF NOT EXISTS idx_trading_accounts_pending_approval 
ON public.trading_accounts(status, created_at) 
WHERE status = 'pending_approval';

