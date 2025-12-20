-- Row Level Security (RLS) pour RendR
-- Activation RLS et création des policies

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_balances ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES pour users
-- ============================================

-- Les users peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Les users peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- POLICIES pour trading_accounts
-- ============================================

-- Les users peuvent voir leurs propres comptes de trading
CREATE POLICY "Users can view own trading accounts"
    ON public.trading_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Les users peuvent créer leurs propres comptes de trading
CREATE POLICY "Users can create own trading accounts"
    ON public.trading_accounts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les users peuvent mettre à jour leurs propres comptes de trading
-- Note: Le VPS manager utilisera le service role pour bypasser cette policy
CREATE POLICY "Users can update own trading accounts"
    ON public.trading_accounts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Les users peuvent supprimer leurs propres comptes de trading
CREATE POLICY "Users can delete own trading accounts"
    ON public.trading_accounts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLICIES pour trades
-- ============================================

-- Les users peuvent voir leurs propres trades via leurs comptes
CREATE POLICY "Users can view own trades"
    ON public.trades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.trading_accounts
            WHERE trading_accounts.id = trades.trading_account_id
            AND trading_accounts.user_id = auth.uid()
        )
    );

-- L'insertion de trades se fait uniquement via le backend (service role)
-- Pas de policy INSERT pour les users normaux

-- ============================================
-- POLICIES pour cashback_balances
-- ============================================

-- Les users peuvent voir leurs propres balances de cashback
CREATE POLICY "Users can view own cashback balances"
    ON public.cashback_balances
    FOR SELECT
    USING (auth.uid() = user_id);

-- La mise à jour des balances se fait uniquement via le backend (service role)
-- Pas de policy UPDATE pour les users normaux

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- 1. Le backend NestJS utilisera la SERVICE_ROLE_KEY pour bypasser RLS
--    lors des opérations suivantes :
--    - Insertion de trades (POST /api/trades)
--    - Mise à jour du statut des comptes par le VPS (POST /api/vps/account-status)
--    - Mise à jour des cashback_balances (recalcul automatique)
--
-- 2. Les users authentifiés via Supabase Auth peuvent uniquement :
--    - Voir et gérer leurs propres trading_accounts
--    - Voir leurs propres trades et cashback_balances
--
-- 3. Le VPS manager utilisera une API key spéciale qui sera vérifiée
--    côté backend, puis le backend utilisera service role pour les opérations DB
