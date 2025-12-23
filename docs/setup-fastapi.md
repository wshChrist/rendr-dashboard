# Configuration FastAPI comme proxy

## Pourquoi FastAPI ?

FastAPI peut servir d'intermédiaire entre MetaTrader et Next.js pour éviter les problèmes de connexion WebRequest. C'est souvent plus fiable que de connecter directement MetaTrader à Next.js.

## Installation

### 1. Installer Python
Assurez-vous d'avoir Python 3.8+ installé.

### 2. Installer les dépendances
```bash
cd api-fastapi
pip install -r requirements.txt
```

## Démarrage

### 1. Démarrer FastAPI
```bash
cd api-fastapi
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Vous devriez voir :
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Tester FastAPI
Dans votre navigateur : `http://127.0.0.1:8000/api/test`
Vous devriez voir : `{"status":"ok","message":"FastAPI proxy fonctionne",...}`

### 3. Vérifier la connexion Next.js
Dans votre navigateur : `http://127.0.0.1:8000/health`
Vous devriez voir le statut de Next.js.

## Configuration MetaTrader

### 1. Liste blanche
Dans MetaTrader :
- Outils > Options > Expert Advisors
- Ajouter : `http://127.0.0.1:8000`
- Cocher "Autoriser l'accès WebRequest"
- OK
- **Redémarrer MetaTrader**

### 2. Modifier l'EA
Dans `RendR.mq4`, ligne 11 :
```mql4
input string ApiUrl = "http://127.0.0.1:8000";
```

Recompiler (F7).

### 3. Tester avec TestWebRequestFastAPI
1. Compiler `TestWebRequestFastAPI.mq4`
2. Attacher au graphique
3. Vérifier les logs

## Architecture

```
MetaTrader EA
    ↓ (WebRequest)
FastAPI (port 8000)
    ↓ (HTTP)
Next.js (port 3000)
    ↓
Supabase
```

## Avantages

1. **Plus fiable** : FastAPI gère mieux les requêtes de MetaTrader
2. **Logs détaillés** : Voir toutes les requêtes dans la console FastAPI
3. **Transformation de données** : Peut adapter le format si nécessaire
4. **Gestion d'erreurs** : Meilleure gestion des erreurs de connexion

## Dépannage

### FastAPI ne démarre pas
- Vérifier que Python est installé
- Vérifier que les dépendances sont installées : `pip install -r requirements.txt`

### FastAPI ne peut pas se connecter à Next.js
- Vérifier que Next.js est démarré : `npm run dev`
- Vérifier l'URL dans `main.py` : `NEXTJS_URL = "http://127.0.0.1:3000"`

### MetaTrader ne peut pas se connecter à FastAPI
- Vérifier que FastAPI est démarré
- Vérifier la liste blanche MetaTrader
- Vérifier que MetaTrader est lancé en administrateur



