-- ========================================
-- SCRIPT SQL COMPLET POUR LA PAGE ADMIN
-- ========================================
-- Ce script contient toutes les tables, index, triggers et policies
-- nécessaires au bon fonctionnement de la page d'administration
--
-- IMPORTANT: Exécutez les migrations dans l'ordre :
-- 1. 001_initial_schema.sql
-- 2. 002_rls_policies.sql
-- 3. 003_add_withdrawals_table.sql
-- 4. 007_add_broker_settings_table.sql
-- 5. Ce fichier (008_admin_setup_complete.sql) pour vérifier que tout est en place
-- ========================================

-- Vérification que toutes les tables nécessaires existent
DO $$
BEGIN
    -- Vérifier la table users
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        RAISE EXCEPTION 'La table users n''existe pas. Exécutez d''abord 001_initial_schema.sql';
    END IF;

    -- Vérifier la table trading_accounts
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trading_accounts') THEN
        RAISE EXCEPTION 'La table trading_accounts n''existe pas. Exécutez d''abord 001_initial_schema.sql';
    END IF;

    -- Vérifier la table trades
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trades') THEN
        RAISE EXCEPTION 'La table trades n''existe pas. Exécutez d''abord 001_initial_schema.sql';
    END IF;

    -- Vérifier la table withdrawals
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawals') THEN
        RAISE EXCEPTION 'La table withdrawals n''existe pas. Exécutez d''abord 003_add_withdrawals_table.sql';
    END IF;

    -- Vérifier la table broker_settings
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'broker_settings') THEN
        RAISE EXCEPTION 'La table broker_settings n''existe pas. Exécutez d''abord 007_add_broker_settings_table.sql';
    END IF;
END $$;

-- ========================================
-- INDEX SUPPLÉMENTAIRES POUR L'ADMIN
-- ========================================

-- Index pour améliorer les requêtes admin sur withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_at ON public.withdrawals(processed_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_requested_at ON public.withdrawals(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_close_time_symbol ON public.trades(close_time, symbol);

-- ========================================
-- VUES UTILES POUR L'ADMIN (OPTIONNEL)
-- ========================================

-- Vue pour les statistiques rapides des retraits
CREATE OR REPLACE VIEW admin_withdrawals_summary AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(requested_at) as first_request,
    MAX(requested_at) as last_request
FROM public.withdrawals
GROUP BY status;

-- Vue pour les statistiques des utilisateurs
CREATE OR REPLACE VIEW admin_users_summary AS
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT ta.user_id) as users_with_accounts,
    COUNT(ta.id) as total_accounts,
    COUNT(CASE WHEN ta.status = 'connected' THEN 1 END) as connected_accounts
FROM public.users u
LEFT JOIN public.trading_accounts ta ON u.id = ta.user_id;

-- Vue pour les statistiques des trades (30 derniers jours)
CREATE OR REPLACE VIEW admin_trades_30d_summary AS
SELECT 
    DATE(close_time) as trade_date,
    COUNT(*) as trades_count,
    SUM(lots) as total_lots,
    SUM(commission) as total_commission,
    SUM(profit) as total_profit
FROM public.trades
WHERE close_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE(close_time)
ORDER BY trade_date DESC;

-- ========================================
-- FONCTIONS UTILES POUR L'ADMIN
-- ========================================

-- Fonction pour obtenir les KPIs admin rapidement
CREATE OR REPLACE FUNCTION get_admin_kpis()
RETURNS TABLE (
    total_users BIGINT,
    total_accounts BIGINT,
    connected_accounts BIGINT,
    trades_last_30d BIGINT,
    pending_withdrawals_count BIGINT,
    pending_withdrawals_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.users)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.trading_accounts)::BIGINT as total_accounts,
        (SELECT COUNT(*) FROM public.trading_accounts WHERE status = 'connected')::BIGINT as connected_accounts,
        (SELECT COUNT(*) FROM public.trades WHERE close_time >= NOW() - INTERVAL '30 days')::BIGINT as trades_last_30d,
        (SELECT COUNT(*) FROM public.withdrawals WHERE status IN ('pending', 'processing'))::BIGINT as pending_withdrawals_count,
        (SELECT COALESCE(SUM(amount), 0) FROM public.withdrawals WHERE status IN ('pending', 'processing'))::NUMERIC as pending_withdrawals_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PERMISSIONS POUR LES VUES ET FONCTIONS
-- ========================================

-- Les admins (via service role) peuvent accéder à tout
-- Les utilisateurs normaux ne peuvent pas accéder aux vues admin
GRANT SELECT ON admin_withdrawals_summary TO authenticated;
GRANT SELECT ON admin_users_summary TO authenticated;
GRANT SELECT ON admin_trades_30d_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_kpis() TO authenticated;

-- ========================================
-- NOTES IMPORTANTES
-- ========================================
-- 
-- 1. La page admin utilise le SERVICE_ROLE_KEY pour bypasser RLS
--    Toutes les requêtes admin passent par createServiceRoleClient()
--
-- 2. Les tables utilisées par l'admin :
--    - users : pour compter les utilisateurs
--    - trading_accounts : pour compter les comptes et leur statut
--    - trades : pour calculer les statistiques de cashback
--    - withdrawals : pour gérer les retraits
--    - broker_settings : pour gérer la disponibilité des brokers
--
-- 3. Les index sont cruciaux pour les performances des requêtes admin
--    qui analysent de grandes quantités de données
--
-- 4. Les vues et fonctions sont optionnelles mais recommandées
--    pour simplifier les requêtes complexes

