-- Script SQL pour définir un utilisateur comme administrateur
-- 
-- Usage dans Supabase SQL Editor:
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. Allez dans SQL Editor > New query
-- 4. Copiez-collez ce script
-- 5. Remplacez 'peka0190@gmail.com' par l'email de l'utilisateur
-- 6. Cliquez sur Run

-- ============================================================
-- MÉTHODE 1 : Mettre à jour par email (Recommandé)
-- ============================================================

-- Mettre à jour les métadonnées pour ajouter le rôle admin
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'peka0190@gmail.com';

-- Vérifier que la mise à jour a fonctionné
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email = 'peka0190@gmail.com';

-- ============================================================
-- MÉTHODE 2 : Mettre à jour par ID utilisateur
-- ============================================================

-- D'abord, trouver l'ID de l'utilisateur
-- SELECT id, email, raw_user_meta_data 
-- FROM auth.users 
-- WHERE email = 'peka0190@gmail.com';

-- Puis mettre à jour avec l'ID (remplacez 'user-id-here' par l'ID réel)
-- UPDATE auth.users
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE id = 'user-id-here';

-- ============================================================
-- VÉRIFICATION : Voir tous les utilisateurs avec leur rôle
-- ============================================================

-- SELECT 
--   id, 
--   email, 
--   raw_user_meta_data->>'role' as role,
--   raw_user_meta_data,
--   created_at
-- FROM auth.users 
-- ORDER BY created_at DESC;

-- ============================================================
-- SUPPRIMER LE RÔLE ADMIN (si nécessaire)
-- ============================================================

-- Pour retirer le rôle admin d'un utilisateur:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'role'
-- WHERE email = 'peka0190@gmail.com';

