-- Ajouter le champ payout_per_lot_by_category dans la table brokers
-- Ce champ stocke les montants payés par lot en fonction des catégories de paires

ALTER TABLE public.brokers 
ADD COLUMN IF NOT EXISTS payout_per_lot_by_category JSONB DEFAULT '{}'::jsonb;

-- Commentaire pour documenter le format du JSONB
-- Format attendu : 
-- {
--   "majors": 5.0,      -- Paiement par lot pour les paires majeures (EUR/USD, GBP/USD, etc.)
--   "minors": 4.0,      -- Paiement par lot pour les paires mineures (EUR/GBP, EUR/JPY, etc.)
--   "exotics": 3.0,     -- Paiement par lot pour les paires exotiques
--   "indices": 6.0,     -- Paiement par lot pour les indices (US30, NAS100, etc.)
--   "metals": 5.5,      -- Paiement par lot pour les métaux (XAU/USD, XAG/USD, etc.)
--   "crypto": 4.5       -- Paiement par lot pour les cryptomonnaies
-- }

COMMENT ON COLUMN public.brokers.payout_per_lot_by_category IS 'Montants payés par lot en fonction des catégories de paires (en euros ou unité de devise)';



