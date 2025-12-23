# Tester l'EA avec les logs de debug

## Commandes PowerShell (corrigées)

### Démarrer FastAPI
```powershell
cd "d:\Travail\Travaux\RendR Dashboard\next-shadcn-dashboard-starter\api-fastapi"
uvicorn main:app --host 0.0.0.0 --port 8001
```

**Note** : Dans PowerShell, utilisez `;` au lieu de `&&` pour enchaîner les commandes, ou exécutez-les séparément.

## Étapes de test

1. **Démarrer FastAPI** (voir commande ci-dessus)
2. **Compiler l'EA** dans MetaEditor (F7)
3. **Attacher l'EA** à un graphique dans MetaTrader
4. **Observer les logs** :
   - Logs MetaTrader (onglet Experts)
   - Console FastAPI
   - Fichier de log : `.cursor/debug.log` ou `MQL4/Files/RendR_debug.log`

## Emplacements des logs

- **Log principal** : `d:\Travail\Travaux\RendR Dashboard\next-shadcn-dashboard-starter\.cursor\debug.log`
- **Log alternatif** : `MQL4/Files/RendR_debug.log` (dans le dossier MetaTrader)



