# Script PowerShell pour démarrer le serveur de test
Write-Host "Démarrage du serveur de test sur le port 3001..." -ForegroundColor Cyan

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Changer de répertoire
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Démarrer le serveur
Write-Host "`nServeur de test démarré. Appuyez sur Ctrl+C pour arrêter." -ForegroundColor Yellow
Write-Host "Testez dans votre navigateur: http://127.0.0.1:3001/test" -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor Yellow

node test-server.js


