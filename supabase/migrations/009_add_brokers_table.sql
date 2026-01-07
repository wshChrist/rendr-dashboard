-- Table brokers pour stocker les informations des brokers partenaires

CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('forex', 'crypto', 'futures', 'multi')),
    cashback_rate NUMERIC(5, 4) NOT NULL CHECK (cashback_rate >= 0 AND cashback_rate <= 1), -- Ex: 0.20 = 20%
    min_withdrawal NUMERIC(10, 2) NOT NULL CHECK (min_withdrawal >= 0),
    description TEXT,
    website_url TEXT NOT NULL,
    supported_pairs TEXT[] DEFAULT '{}', -- Tableau de paires supportées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_brokers_name ON public.brokers(name);
CREATE INDEX IF NOT EXISTS idx_brokers_category ON public.brokers(category);

-- Trigger pour updated_at automatique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_brokers_updated_at'
    ) THEN
        CREATE TRIGGER update_brokers_updated_at
            BEFORE UPDATE ON public.brokers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte (utile côté app pour afficher les brokers disponibles)
CREATE POLICY "Anyone can view brokers"
    ON public.brokers
    FOR SELECT
    USING (true);

-- Les modifications se font via service role (pas de policy INSERT/UPDATE/DELETE pour les utilisateurs normaux)

