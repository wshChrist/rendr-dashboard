-- Migration pour ajouter une contrainte d'unicité sur le champ login
-- Cela garantit qu'un compte de trading (login) ne peut être associé qu'à un seul utilisateur

-- Note: Si des doublons existent déjà, cette migration échouera.
-- Dans ce cas, il faudra d'abord nettoyer les données en ne gardant qu'un seul compte par login
-- (par exemple, garder le plus récent)

-- Supprimer les doublons en gardant le compte le plus récent pour chaque login
-- (à décommenter si nécessaire)
-- DELETE FROM public.trading_accounts
-- WHERE id NOT IN (
--     SELECT DISTINCT ON (login) id
--     FROM public.trading_accounts
--     ORDER BY login, created_at DESC
-- );

-- Ajouter la contrainte d'unicité sur le champ login
ALTER TABLE public.trading_accounts
ADD CONSTRAINT trading_accounts_login_unique UNIQUE (login);
