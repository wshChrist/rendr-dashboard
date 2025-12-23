-- Migration pour ajouter la table withdrawals

-- Table withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal', 'crypto')),
    payment_details TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON public.withdrawals(requested_at);

-- Trigger pour updated_at automatique sur withdrawals
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir uniquement leurs propres retraits
CREATE POLICY "Users can view their own withdrawals"
    ON public.withdrawals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres retraits
CREATE POLICY "Users can create their own withdrawals"
    ON public.withdrawals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs ne peuvent pas modifier leurs retraits (seuls les admins peuvent le faire)
-- Cette politique peut être ajustée selon vos besoins

