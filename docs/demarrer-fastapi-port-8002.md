# Démarrer FastAPI sur le port 8002

## Commande PowerShell

```powershell
cd "d:\Travail\Travaux\RendR Dashboard\next-shadcn-dashboard-starter\api-fastapi"
python -m uvicorn main:app --host 0.0.0.0 --port 8002
```

Ou avec uvicorn directement :
```powershell
cd "d:\Travail\Travaux\RendR Dashboard\next-shadcn-dashboard-starter\api-fastapi"
uvicorn main:app --host 0.0.0.0 --port 8002
```

## Configuration mise à jour

- **Port FastAPI** : 8002
- **URL EA** : `http://192.168.1.142:8002`
- **Liste blanche MetaTrader** : Ajouter `http://192.168.1.142:8002/api/trades/register`

## Vérifier que FastAPI est démarré

```powershell
netstat -ano | findstr :8002
```

Vous devriez voir une ligne avec `0.0.0.0:8002` ou `192.168.1.142:8002`.

## Tester dans le navigateur

Ouvrir : `http://192.168.1.142:8002/api/test`

Vous devriez voir : `{"status":"ok",...}`



