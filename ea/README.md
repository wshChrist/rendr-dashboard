# Expert Advisors RendR

Ce dossier contient les Expert Advisors pour MetaTrader 4/5 permettant d'extraire les données de trading vers Supabase via le dashboard RendR.

## Fichiers

- `RendRDataExtractor.mq4` - **EA principal recommandé** pour l'extraction des données MT4 vers Supabase via le dashboard
- `RendrAccountMonitor.mq4` - EA de référence (monitoring uniquement)
- `RendR.mq4` - Ancienne version utilisant un endpoint local

## Installation

### 1. Prérequis

- MetaTrader 4 installé et fonctionnel
- Un compte de trading créé sur [RendR Dashboard](https://rendr-dashboard.vercel.app/)
- Connexion internet active

### 2. Configuration du compte dans le dashboard

Avant d'utiliser l'EA, vous devez créer votre compte de trading via le dashboard :

1. Connectez-vous à https://rendr-dashboard.vercel.app/
2. Allez dans la section des comptes de trading
3. Créez un nouveau compte avec :
   - Le **login** (numéro de compte MT4)
   - Le **serveur** (nom du serveur MT4)
   - La **plateforme** (MT4)
   - Le broker

### 3. Installation de l'EA dans MetaTrader

1. Copiez le fichier `RendRDataExtractor.mq4` dans le dossier `MQL4/Experts/` de votre MetaTrader
2. Redémarrez MetaTrader 4 (ou compilez l'EA depuis MetaEditor : F7)
3. L'EA devrait apparaître dans le navigateur MetaTrader sous "Expert Advisors"

### 4. Configuration de l'accès WebRequest

**IMPORTANT** : MetaTrader doit autoriser les requêtes HTTP vers le dashboard.

1. Ouvrez MetaTrader 4
2. Allez dans **Outils > Options > Expert Advisors**
3. Cochez : **"Autoriser l'accès WebRequest pour les URLs listées"**
4. Cliquez sur **"Ajouter"** et entrez l'URL exacte :
   ```
   https://rendr-dashboard.vercel.app
   ```
5. Cliquez **OK**
6. **FERMEZ COMPLÈTEMENT MetaTrader**
7. **RELANCEZ MetaTrader EN ADMINISTRATEUR** (clic droit > Exécuter en tant qu'administrateur)

### 5. Configuration de l'EA

1. Ouvrez un graphique dans MetaTrader (n'importe quelle paire)
2. Glissez-déposez `RendRDataExtractor` sur le graphique
3. Dans les paramètres de l'EA, configurez :

   - **API_BASE_URL** : `https://rendr-dashboard.vercel.app` (par défaut)
   - **EnableDebugLog** : `true` pour activer les logs détaillés
   - **SendInterval** : `60` secondes (intervalle d'envoi des nouveaux trades)
   - **HistoryDepth** : `1000` (nombre de trades historiques à synchroniser au démarrage)
   - **SyncOnStartup** : `true` pour synchroniser l'historique au démarrage

4. Cochez **"Autoriser le trading algorithmique"** et **"Autoriser l'importation de DLL"**
5. Cliquez **OK**

## Fonctionnement

### Au démarrage

1. L'EA s'enregistre automatiquement auprès du dashboard avec :
   - Le numéro de compte MT4
   - Le nom du serveur
   - La plateforme (MT4)

2. Le dashboard répond avec :
   - `external_account_id` : Identifiant unique du compte
   - `api_secret` : Clé secrète pour signer les requêtes

3. Si `SyncOnStartup` est activé, l'EA synchronise l'historique des trades fermés

### Pendant l'exécution

- L'EA vérifie périodiquement (selon `SendInterval`) les nouveaux trades fermés
- Chaque nouveau trade est envoyé au dashboard avec :
  - Le ticket (numéro unique du trade)
  - Le symbole (paire de devises)
  - Le volume (lots)
  - La commission
  - Le swap
  - Le profit
  - Les dates d'ouverture et de fermeture
  - Une signature HMAC (pour sécurité)

### Données synchronisées

L'EA synchronise automatiquement vers Supabase :

- ✅ **Trades fermés** : Tous les trades qui ont été fermés (buy/sell)
- ✅ **Positions ouvertes** : (via la synchronisation périodique)
- ✅ **Informations du compte** : Balance, equity, marge, etc.

## Logs et débogage

Les logs sont enregistrés dans le fichier `RendR_DataExtractor.log` dans le dossier `Files/` de MetaTrader.

Vous pouvez aussi consulter les logs dans l'onglet "Experts" de MetaTrader.

### Messages courants

- `✅ Compte enregistré avec succès` : L'EA s'est correctement enregistré
- `✅ X nouveau(x) trade(s) envoyé(s)` : Des nouveaux trades ont été synchronisés
- `❌ Erreur HTTP: 4060` : URL non autorisée (voir section Configuration)
- `❌ Erreur HTTP: 5200` : Impossible de se connecter au dashboard

## Résolution des problèmes

### L'EA ne s'enregistre pas

1. Vérifiez que le compte existe dans le dashboard avec le bon login et serveur
2. Vérifiez votre connexion internet
3. Vérifiez que l'URL est correcte dans les paramètres de l'EA
4. Consultez les logs pour plus de détails

### Erreur 4060 (URL non autorisée)

1. Vérifiez que l'URL est bien ajoutée dans les paramètres WebRequest de MetaTrader
2. Redémarrez MetaTrader **en administrateur**
3. Vérifiez que l'URL exacte correspond (sans `/` final)

### Erreur 5200 (Impossible de se connecter)

1. Testez l'URL dans votre navigateur : https://rendr-dashboard.vercel.app
2. Vérifiez votre connexion internet
3. Vérifiez que le firewall/autoroute ne bloque pas MetaTrader
4. Essayez de ping le serveur depuis la ligne de commande

### Les trades ne sont pas synchronisés

1. Vérifiez que l'EA est bien actif (icône sourire dans le coin du graphique)
2. Vérifiez les logs pour voir si des erreurs apparaissent
3. Vérifiez que les trades sont bien dans l'historique MT4
4. Augmentez le `SendInterval` si trop de trades sont envoyés

## Architecture

```
┌─────────────┐         ┌──────────────────────┐         ┌──────────┐
│   MetaTrader│         │  RendR Dashboard     │         │ Supabase │
│      MT4    │────────>│  (Vercel)            │────────>│          │
│             │  HTTP   │  /api/trades/*       │  Direct │          │
└─────────────┘         └──────────────────────┘         └──────────┘
```

1. L'EA MT4 envoie les données via HTTP vers le dashboard
2. Le dashboard (Next.js API routes) traite les données
3. Les données sont stockées dans Supabase
4. Le dashboard affiche les données à l'utilisateur

## Sécurité

- Les requêtes sont signées avec HMAC (implémentation simplifiée dans MQL4)
- L'authentification se fait via `external_account_id` unique par compte
- Les données sont transmises via HTTPS (SSL/TLS)
- Le dashboard valide que le compte existe avant d'accepter les données

## Support

Pour toute question ou problème, consultez :
- Les logs de l'EA dans MetaTrader
- La documentation du dashboard : https://rendr-dashboard.vercel.app/
- Le support RendR
