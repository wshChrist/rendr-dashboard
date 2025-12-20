-- Migration initiale pour RendR
-- Création des tables et configuration RLS

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table users (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table trading_accounts
CREATE TABLE IF NOT EXISTS public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    broker TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('MT4', 'MT5')),
    server TEXT NOT NULL,
    login TEXT NOT NULL,
    investor_password TEXT NOT NULL, -- Chiffré côté backend
    external_account_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_vps_setup' CHECK (status IN ('pending_vps_setup', 'connected', 'error', 'disconnected')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table trades
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trading_account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    ticket BIGINT NOT NULL UNIQUE,
    symbol TEXT NOT NULL,
    lots NUMERIC(10, 2) NOT NULL,
    commission NUMERIC(10, 2) NOT NULL DEFAULT 0,
    swap NUMERIC(10, 2) NOT NULL DEFAULT 0,
    profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    open_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table cashback_balances
CREATE TABLE IF NOT EXISTS public.cashback_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- Format: 'YYYY-MM'
    volume_lots NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cashback_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_external_id ON public.trading_accounts(external_account_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON public.trading_accounts(status);
CREATE INDEX IF NOT EXISTS idx_trades_trading_account_id ON public.trades(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trades_ticket ON public.trades(ticket);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON public.trades(close_time);
CREATE INDEX IF NOT EXISTS idx_cashback_balances_user_id ON public.cashback_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_balances_period ON public.cashback_balances(period);

-- Trigger pour updated_at automatique sur trading_accounts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trading_accounts_updated_at
    BEFORE UPDATE ON public.trading_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at automatique sur cashback_balances
CREATE TRIGGER update_cashback_balances_updated_at
    BEFORE UPDATE ON public.cashback_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour synchroniser users depuis auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un user dans public.users lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
