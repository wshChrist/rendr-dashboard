# Script PowerShell pour ouvrir le port 8000 dans le firewall Windows
# À exécuter en tant qu'administrateur

Write-Host "Création de la règle de firewall pour le port 8000..." -ForegroundColor Yellow

# Vérifier si la règle existe déjà
$existingRule = Get-NetFirewallRule -DisplayName "FastAPI Port 8000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "La règle existe déjà. Suppression..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "FastAPI Port 8000"
}

# Créer la règle
New-NetFirewallRule -DisplayName "FastAPI Port 8000" `
    -Direction Inbound `
    -LocalPort 8000 `
    -Protocol TCP `
    -Action Allow `
    -Description "Autorise les connexions entrantes sur le port 8000 pour FastAPI"

Write-Host "✅ Règle de firewall créée avec succès !" -ForegroundColor Green
Write-Host "Le port 8000 est maintenant ouvert pour les connexions entrantes." -ForegroundColor Green
