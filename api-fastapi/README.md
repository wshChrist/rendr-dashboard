# API FastAPI - Proxy entre MetaTrader et Next.js

Cette API sert d'intermédiaire entre MetaTrader et Next.js pour éviter les problèmes de connexion WebRequest.

## Installation

```bash
# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

## Démarrage

```bash
# Mode développement (avec rechargement automatique)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Mode production
uvicorn main:app --host 0.0.0.0 --port 8000
```

L'API sera accessible sur : `http://127.0.0.1:8000`

## Endpoints

### Test
- `GET /` - Vérification que l'API fonctionne
- `GET /health` - Vérification de santé (inclut le statut Next.js)
- `GET /api/test` - Test simple

### API MetaTrader
- `POST /api/trades/register` - Enregistrement d'un compte
- `POST /api/trades` - Soumission d'un trade

## Configuration MetaTrader

Dans l'EA, utiliser :
```mql4
input string ApiUrl = "http://127.0.0.1:8000";
```

Dans la liste blanche MetaTrader, ajouter :
- `http://127.0.0.1:8000`

## Avantages

1. **Plus simple pour MetaTrader** : FastAPI est plus permissif avec les requêtes
2. **Meilleur contrôle** : Logs détaillés, gestion d'erreurs
3. **Proxy intelligent** : Peut transformer les données si nécessaire
4. **Évite les problèmes CORS** : Gestion complète des headers CORS

## Logs

Les logs sont affichés dans la console et incluent :
- Toutes les requêtes reçues de MetaTrader
- Les réponses de Next.js
- Les erreurs de connexion

## Configuration Next.js

L'URL de Next.js est configurée dans `main.py` :
```python
NEXTJS_URL = "http://127.0.0.1:3000"
```

Modifiez cette valeur si Next.js tourne sur un autre port.



