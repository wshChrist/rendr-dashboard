# Configuration du Firewall pour MetaTrader et FastAPI

## Règles créées

### ✅ Port 8001 - Entrant
- **Nom** : `FastAPI Port 8001 - Entrant`
- **Direction** : Inbound
- **Port** : 8001
- **Action** : Allow
- **Description** : Autorise les connexions entrantes sur le port 8001 pour FastAPI

### ✅ Port 8001 - Sortant
- **Nom** : `FastAPI Port 8001 - Sortant`
- **Direction** : Outbound
- **Port** : 8001
- **Action** : Allow
- **Description** : Autorise les connexions sortantes vers le port 8001

## Vérification

Pour vérifier que les règles sont actives :

```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8001*"} | Select-Object DisplayName, Enabled, Direction, Action
```

## Configuration MetaTrader

En plus du firewall Windows, vous devez aussi :

1. **Ajouter l'URL dans la liste blanche MetaTrader** :
   - Outils > Options > Expert Advisors
   - Cocher "Autoriser l'accès WebRequest pour les URLs listées"
   - Ajouter : `http://192.168.1.142:8001/api/trades/register`

2. **Lancer MetaTrader en administrateur**

## Si MetaTrader est toujours bloqué

Si vous voulez créer une règle spécifique pour MetaTrader :

1. Trouver le chemin de `terminal.exe` (MetaTrader)
2. Exécuter le script : `.\configurer-firewall-mt4.ps1`

Ou créer manuellement :

```powershell
# Remplacer C:\Chemin\Vers\MetaTrader\terminal.exe par le vrai chemin
New-NetFirewallRule -DisplayName "MetaTrader - Autoriser connexions sortantes" `
    -Direction Outbound `
    -Program "C:\Chemin\Vers\MetaTrader\terminal.exe" `
    -Action Allow `
    -Description "Autorise MetaTrader à établir des connexions sortantes"
```

## Désactiver temporairement le firewall (TEST UNIQUEMENT)

⚠️ **ATTENTION** : Ne faites cela que pour tester, jamais en production !

```powershell
# Désactiver temporairement
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Réactiver
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

## Problèmes courants

### Le firewall bloque toujours
- Vérifier que les règles sont **Enabled**
- Vérifier que le **Profile** correspond (Domain, Private, Public)
- Redémarrer MetaTrader après avoir créé les règles

### MetaTrader ne peut toujours pas se connecter
- Vérifier que l'URL est dans la liste blanche MetaTrader
- Vérifier que MetaTrader est lancé en administrateur
- Vérifier que FastAPI est démarré et écoute sur 0.0.0.0:8001


