# Guide SQL pour la Page Admin

Ce document liste tous les scripts SQL nécessaires au bon fonctionnement de la page d'administration.

## 📋 Tables Requises

La page admin utilise les tables suivantes :

1. **`users`** - Liste des utilisateurs
2. **`trading_accounts`** - Comptes de trading
3. **`trades`** - Historique des trades
4. **`withdrawals`** - Demandes de retraits
5. **`broker_settings`** - Paramètres des brokers (disponibilité, maintenance)

## 🚀 Installation

### Étape 1 : Exécuter les migrations dans l'ordre

Dans Supabase SQL Editor, exécutez les migrations dans cet ordre :

```sql
-- 1. Schéma initial (tables de base)
-- Fichier: supabase/migrations/001_initial_schema.sql

-- 2. RLS Policies
-- Fichier: supabase/migrations/002_rls_policies.sql

-- 3. Table withdrawals
-- Fichier: supabase/migrations/003_add_withdrawals_table.sql

-- 4. Table broker_settings
-- Fichier: supabase/migrations/007_add_broker_settings_table.sql

-- 5. Vérification et optimisations admin
-- Fichier: supabase/migrations/008_admin_setup_complete.sql
```

### Étape 2 : Vérifier que tout est en place

Exécutez cette requête pour vérifier que toutes les tables existent :

```sql
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'trading_accounts', 'trades', 'withdrawals', 'broker_settings') 
        THEN '✅ Requis'
        ELSE '⚠️ Optionnel'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('users', 'trading_accounts', 'trades', 'withdrawals', 'broker_settings', 'cashback_balances')
ORDER BY table_name;
```

## 📊 Structure des Tables

### Table `users`
```sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Utilisé par l'admin pour :**
- Compter le nombre total d'utilisateurs
- Afficher les informations utilisateur dans les retraits

### Table `trading_accounts`
```sql
CREATE TABLE IF NOT EXISTS public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    broker TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('MT4', 'MT5')),
    server TEXT NOT NULL,
    login TEXT NOT NULL,
    investor_password TEXT NOT NULL,
    external_account_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_vps_setup' 
        CHECK (status IN ('pending_vps_setup', 'connected', 'error', 'disconnected')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Utilisé par l'admin pour :**
- Compter le nombre total de comptes
- Compter les comptes connectés
- Joindre avec trades pour obtenir le broker

### Table `trades`
```sql
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
```

**Utilisé par l'admin pour :**
- Calculer le cashback des 30 derniers jours
- Générer les graphiques d'évolution
- Compter le nombre de trades

### Table `withdrawals`
```sql
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT NOT NULL 
        CHECK (payment_method IN ('bank_transfer', 'paypal', 'crypto')),
    payment_details TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    transaction_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Utilisé par l'admin pour :**
- Lister tous les retraits
- Filtrer par statut
- Mettre à jour le statut des retraits
- Calculer les montants en attente

### Table `broker_settings`
```sql
CREATE TABLE IF NOT EXISTS public.broker_settings (
    broker_name TEXT PRIMARY KEY,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Utilisé par l'admin pour :**
- Activer/désactiver des brokers
- Mettre des brokers en maintenance
- Ajouter des messages de maintenance

## 🔍 Index Requis

Les index suivants sont cruciaux pour les performances :

```sql
-- Index pour users
-- (Pas d'index spécifique nécessaire, la clé primaire suffit)

-- Index pour trading_accounts
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON public.trading_accounts(status);

-- Index pour trades
CREATE INDEX IF NOT EXISTS idx_trades_trading_account_id ON public.trades(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_trades_close_time ON public.trades(close_time);
CREATE INDEX IF NOT EXISTS idx_trades_close_time_symbol ON public.trades(close_time, symbol);

-- Index pour withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested_at ON public.withdrawals(requested_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_at ON public.withdrawals(processed_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status_requested_at ON public.withdrawals(status, requested_at DESC);
```

## 🔐 Sécurité

### Service Role

La page admin utilise le **SERVICE_ROLE_KEY** pour bypasser RLS et accéder à toutes les données. C'est normal et sécurisé car :

1. Le SERVICE_ROLE_KEY est stocké côté serveur uniquement
2. L'accès admin est protégé par `requireAdmin()` qui vérifie le rôle dans `user_metadata`
3. Seuls les utilisateurs avec `role: 'admin'` peuvent accéder aux routes admin

### RLS Policies

Les RLS policies sont en place pour les utilisateurs normaux, mais les admins utilisent le service role qui les bypassent automatiquement.

## 🧪 Tests

### Vérifier que les tables existent

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'trading_accounts', 'trades', 'withdrawals', 'broker_settings')
ORDER BY table_name;
```

### Vérifier les index

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('users', 'trading_accounts', 'trades', 'withdrawals', 'broker_settings')
ORDER BY tablename, indexname;
```

### Tester la fonction admin KPIs

```sql
SELECT * FROM get_admin_kpis();
```

## 📝 Script SQL Complet

Un script complet est disponible dans :
- `supabase/migrations/008_admin_setup_complete.sql`

Ce script :
- ✅ Vérifie que toutes les tables existent
- ✅ Crée les index supplémentaires
- ✅ Crée des vues utiles pour l'admin
- ✅ Crée des fonctions helper

## ⚠️ Notes Importantes

1. **Ordre d'exécution** : Les migrations doivent être exécutées dans l'ordre
2. **Service Role** : Assurez-vous que `SUPABASE_SERVICE_ROLE_KEY` est configuré dans `.env.local`
3. **RLS** : Les admins bypassent RLS via service role, c'est normal
4. **Index** : Les index sont cruciaux pour les performances des requêtes admin

## 🐛 Dépannage

### Erreur "relation does not exist"

Si vous obtenez une erreur indiquant qu'une table n'existe pas :
1. Vérifiez que vous avez exécuté toutes les migrations dans l'ordre
2. Vérifiez que vous êtes connecté au bon projet Supabase
3. Vérifiez que les migrations ont été exécutées sans erreur

### Erreur "permission denied"

Si vous obtenez une erreur de permission :
1. Vérifiez que RLS est activé sur les tables
2. Vérifiez que le SERVICE_ROLE_KEY est correctement configuré
3. Vérifiez que vous utilisez `createServiceRoleClient()` dans les routes admin

### Performances lentes

Si les requêtes admin sont lentes :
1. Vérifiez que tous les index sont créés
2. Utilisez `EXPLAIN ANALYZE` pour identifier les requêtes lentes
3. Considérez l'ajout d'index supplémentaires selon vos besoins

