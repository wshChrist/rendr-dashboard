# Flux Automatique de Configuration des Comptes MT4/MT5

## Vue d'ensemble

Ce document décrit le flux automatique qui permet à un client d'enregistrer un compte sur le dashboard, et que le VPS se connecte automatiquement au compte MT4/MT5 pour synchroniser les données sans intervention humaine.

## Architecture du Flux

```
Dashboard → Backend API → Supabase → VPS Manager → MT4/MT5 Terminal → EA → Backend API → Supabase → Dashboard
```

## Étapes du Flux

### 1. Enregistrement du Compte (Dashboard → Backend → Supabase)

**Fichiers concernés :**
- `src/features/brokers/components/available-brokers.tsx` - Interface utilisateur
- `backend/src/trading-accounts/trading-accounts.service.ts` - Service backend
- `backend/src/trading-accounts/trading-accounts.controller.ts` - Controller API

**Processus :**
1. L'utilisateur remplit le formulaire de connexion avec :
   - ID de compte (login)
   - Mot de passe (investor_password)
   - Serveur MT4/MT5
   - Plateforme (MT4 ou MT5)
   - Broker

2. Le frontend appelle `POST /api/trading-accounts` avec les informations

3. Le backend :
   - Génère un `external_account_id` unique (UUID)
   - Chiffre le mot de passe avec `EncryptionUtil`
   - Insère le compte dans Supabase avec le statut `pending_vps_setup`
   - Retourne les informations du compte (sans le mot de passe)

### 2. Détection par le VPS Manager (VPS → Backend → Supabase)

**Fichiers concernés :**
- `vps-manager/main.py` - Script principal du VPS Manager
- `vps-manager/supabase_client.py` - Client API pour communiquer avec le backend
- `backend/src/vps/vps.service.ts` - Service backend pour le VPS
- `backend/src/vps/vps.controller.ts` - Controller API pour le VPS

**Processus :**
1. Le VPS Manager tourne en boucle avec un intervalle de polling (par défaut 30 secondes)

2. À chaque cycle, il appelle `GET /api/vps/pending-accounts` avec :
   - Header `X-VPS-API-Key` pour l'authentification

3. Le backend :
   - Récupère tous les comptes avec `status = 'pending_vps_setup'`
   - Déchiffre les mots de passe
   - Retourne la liste des comptes en attente

4. Le VPS Manager traite chaque compte en attente

### 3. Configuration du Terminal MT4/MT5 (VPS Manager → MT4/MT5)

**Fichiers concernés :**
- `vps-manager/mt_manager.py` - Gestionnaire MT4/MT5
- `vps-manager/config.py` - Configuration du VPS

**Processus :**
1. Pour chaque compte en attente, le VPS Manager :
   - Crée un dossier terminal dédié : `MT4-{external_account_id}` ou `MT5-{external_account_id}`
   - Copie l'installation MT4/MT5 de base dans ce dossier
   - Copie l'EA (Expert Advisor) dans le dossier `Experts`
   - Crée un fichier de configuration `rendr_ea_config.ini` avec :
     - `external_account_id`
     - `register_url` : URL pour l'enregistrement du compte
     - `trades_url` : URL pour l'envoi des trades
   - Lance le terminal MT4/MT5 en mode portable avec :
     - `/login:{login}`
     - `/password:{password}`
     - `/server:{server}`
     - `/portable`

2. Le terminal MT4/MT5 se lance et tente de se connecter au serveur du broker

3. Si le lancement réussit, le VPS Manager met à jour le statut à `connected`

### 4. Enregistrement par l'EA (EA → Backend)

**Fichiers concernés :**
- `ea/RendR.mq4` - Expert Advisor MT4
- `backend/src/trades/trades.service.ts` - Service pour l'enregistrement
- `backend/src/trades/trades.controller.ts` - Controller API

**Processus :**
1. Au démarrage, l'EA lit le fichier de configuration `rendr_ea_config.ini`

2. L'EA appelle `POST /api/trades/register` avec :
   - `account_number` : Le numéro de compte MT4/MT5
   - `server` : Le serveur MT4/MT5
   - `platform` : MT4 ou MT5

3. Le backend :
   - Cherche le compte dans Supabase via `login` et `server`
   - Retourne l'`external_account_id` et l'`api_secret`

4. L'EA stocke ces informations pour les requêtes futures

### 5. Envoi des Trades (EA → Backend → Supabase)

**Fichiers concernés :**
- `ea/RendR.mq4` - Expert Advisor MT4
- `backend/src/trades/trades.service.ts` - Service pour les trades
- `backend/src/cashback/cashback.service.ts` - Service pour le calcul du cashback

**Processus :**
1. L'EA surveille les trades fermés dans MT4/MT5

2. À intervalles réguliers (par défaut 60 secondes), l'EA envoie les nouveaux trades via `POST /api/trades` avec :
   - Header `X-Trade-Signature` : Signature HMAC pour l'authentification
   - Body : Informations du trade (ticket, symbol, lots, commission, profit, etc.)

3. Le backend :
   - Vérifie la signature HMAC
   - Identifie le compte via le guard `TradeSignatureGuard`
   - Vérifie que le trade n'existe pas déjà (via `ticket`)
   - Insère le trade dans Supabase
   - Recalcule le cashback pour l'utilisateur

### 6. Affichage sur le Dashboard (Supabase → Dashboard)

**Fichiers concernés :**
- `src/features/brokers/components/my-brokers.tsx` - Interface utilisateur
- `backend/src/trading-accounts/trading-accounts.service.ts` - Service backend

**Processus :**
1. Le dashboard charge les comptes via `GET /api/trading-accounts`

2. Pour chaque compte, le dashboard :
   - Affiche le statut (pending_vps_setup, connected, error)
   - Charge les trades depuis Supabase
   - Calcule les statistiques (volume, cashback, etc.)

3. Le dashboard rafraîchit automatiquement toutes les 30 secondes pour les comptes en attente

## Statuts des Comptes

- **`pending_vps_setup`** : Le compte est en attente de configuration par le VPS
- **`connected`** : Le terminal MT4/MT5 est lancé et l'EA est en cours d'enregistrement
- **`error`** : Une erreur s'est produite (avec `error_message` pour les détails)
- **`disconnected`** : Le compte est déconnecté

## Gestion des Erreurs

### Erreurs de Configuration
- Si le terminal MT4/MT5 ne peut pas être lancé, le statut passe à `error`
- Le message d'erreur est stocké dans `error_message` et affiché sur le dashboard

### Erreurs de Connexion
- Si l'EA ne peut pas se connecter au serveur MT4/MT5, le terminal reste ouvert
- L'utilisateur peut vérifier les logs du terminal pour diagnostiquer

### Erreurs de Communication API
- Les erreurs sont loggées avec des traces complètes dans le VPS Manager
- Le VPS Manager continue de fonctionner même en cas d'erreur

## Configuration Requise

### Variables d'Environnement Backend
- `ENCRYPTION_KEY` : Clé pour chiffrer/déchiffrer les mots de passe
- `VPS_API_KEY` : Clé API pour authentifier le VPS Manager

### Variables d'Environnement VPS Manager
- `API_URL` : URL du backend API
- `VPS_API_KEY` : Clé API pour s'authentifier
- `POLLING_INTERVAL` : Intervalle de polling en secondes (défaut: 30)
- `MT4_PATH` : Chemin d'installation de MT4
- `MT5_PATH` : Chemin d'installation de MT5
- `MT4_EA_PATH` : Chemin vers l'EA MT4
- `MT5_EA_PATH` : Chemin vers l'EA MT5
- `TERMINALS_BASE_PATH` : Dossier de base pour les terminaux portables

## Logs et Monitoring

### Logs VPS Manager
- Les logs sont écrits dans `logs/vps-manager.log`
- Format : `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- Les erreurs incluent des traces complètes pour le débogage

### Logs EA
- Les logs de l'EA sont écrits dans le dossier `Files` de MetaTrader
- Fichier : `RendR_debug.log`

## Améliorations Futures

1. **Retry Logic** : Ajouter une logique de retry pour les comptes en erreur
2. **Health Checks** : Vérifier périodiquement que les terminaux sont toujours connectés
3. **Notifications** : Notifier l'utilisateur lorsque son compte est connecté
4. **Métriques** : Ajouter des métriques de performance et de monitoring
