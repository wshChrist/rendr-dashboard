-- ========================================
-- VÉRIFICATION RAPIDE DES TABLES ADMIN
-- ========================================
-- Exécutez ce script dans Supabase SQL Editor
-- pour vérifier que toutes les tables nécessaires existent
-- ========================================

-- Vérifier l'existence des tables
SELECT 
    'users' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
        THEN '✅ Existe'
        ELSE '❌ Manquant - Exécutez 001_initial_schema.sql'
    END as status
UNION ALL
SELECT 
    'trading_accounts',
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trading_accounts')
        THEN '✅ Existe'
        ELSE '❌ Manquant - Exécutez 001_initial_schema.sql'
    END
UNION ALL
SELECT 
    'trades',
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trades')
        THEN '✅ Existe'
        ELSE '❌ Manquant - Exécutez 001_initial_schema.sql'
    END
UNION ALL
SELECT 
    'withdrawals',
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawals')
        THEN '✅ Existe'
        ELSE '❌ Manquant - Exécutez 003_add_withdrawals_table.sql'
    END
UNION ALL
SELECT 
    'broker_settings',
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'broker_settings')
        THEN '✅ Existe'
        ELSE '❌ Manquant - Exécutez 007_add_broker_settings_table.sql'
    END;

-- Vérifier les index critiques
SELECT 
    'Index' as type,
    indexname as name,
    tablename as table_name,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ Existe'
        ELSE '⚠️ Vérifiez'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'trading_accounts', 'trades', 'withdrawals', 'broker_settings')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Compter les enregistrements (pour vérifier que les tables ne sont pas vides)
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM public.users
UNION ALL
SELECT 
    'trading_accounts',
    COUNT(*)
FROM public.trading_accounts
UNION ALL
SELECT 
    'trades',
    COUNT(*)
FROM public.trades
UNION ALL
SELECT 
    'withdrawals',
    COUNT(*)
FROM public.withdrawals
UNION ALL
SELECT 
    'broker_settings',
    COUNT(*)
FROM public.broker_settings;

