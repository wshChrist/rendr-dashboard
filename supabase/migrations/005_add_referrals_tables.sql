-- Migration pour ajouter les tables de parrainage (referrals)

-- Table referrals pour stocker les codes de parrainage
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    referral_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table referral_relationships pour stocker les relations parrain/parrainé
CREATE TABLE IF NOT EXISTS public.referral_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Table referral_earnings pour stocker les gains de parrainage
CREATE TABLE IF NOT EXISTS public.referral_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
    cashback_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Pourcentage (ex: 10.00 = 10%)
    commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0, -- commission_amount = cashback_amount * commission_rate / 100
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    period TEXT NOT NULL, -- Format: 'YYYY-MM' pour regrouper par période
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON public.referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referrer_id ON public.referral_relationships(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referred_id ON public.referral_relationships(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_status ON public.referral_relationships(status);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer_id ON public.referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred_id ON public.referral_earnings(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_status ON public.referral_earnings(status);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_period ON public.referral_earnings(period);

-- Trigger pour updated_at automatique
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_earnings_updated_at
    BEFORE UPDATE ON public.referral_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un code de parrainage unique
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code au format RENDR-XXXXXX (6 caractères alphanumériques)
        new_code := 'RENDR-' || UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = new_code) INTO code_exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement un code de parrainage lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION create_referral_code_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer un code de parrainage pour le nouvel utilisateur
    INSERT INTO public.referrals (user_id, referral_code)
    VALUES (NEW.id, generate_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un code de parrainage
DROP TRIGGER IF EXISTS on_user_created_referral_code ON public.users;
CREATE TRIGGER on_user_created_referral_code
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_referral_code_for_user();

-- RLS Policies pour referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir uniquement leur propre code de parrainage
CREATE POLICY "Users can view their own referral code"
    ON public.referrals
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies pour referral_relationships
ALTER TABLE public.referral_relationships ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les relations où ils sont parrains
CREATE POLICY "Users can view referral relationships where they are referrer"
    ON public.referral_relationships
    FOR SELECT
    USING (auth.uid() = referrer_id);

-- Les utilisateurs peuvent voir leur propre relation (où ils sont parrainés)
CREATE POLICY "Users can view referral relationship where they are referred"
    ON public.referral_relationships
    FOR SELECT
    USING (auth.uid() = referred_id);

-- RLS Policies pour referral_earnings
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs gains de parrainage (où ils sont parrains)
CREATE POLICY "Users can view their referral earnings"
    ON public.referral_earnings
    FOR SELECT
    USING (auth.uid() = referrer_id);
