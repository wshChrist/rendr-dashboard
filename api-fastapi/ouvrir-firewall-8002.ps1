# Script PowerShell pour ouvrir le port 8002 dans le firewall Windows
# À exécuter en tant qu'administrateur

Write-Host "Création de la règle de firewall pour le port 8002..." -ForegroundColor Yellow

# Vérifier si la règle existe déjà
$existingRule = Get-NetFirewallRule -DisplayName "FastAPI Port 8002" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "La règle existe déjà. Suppression..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "FastAPI Port 8002"
}

# Créer la règle entrante
New-NetFirewallRule -DisplayName "FastAPI Port 8002 Inbound" `
    -Direction Inbound `
    -LocalPort 8002 `
    -Protocol TCP `
    -Action Allow `
    -Description "Autorise les connexions entrantes sur le port 8002 pour FastAPI"

# Créer la règle sortante
New-NetFirewallRule -DisplayName "FastAPI Port 8002 Outbound" `
    -Direction Outbound `
    -LocalPort 8002 `
    -Protocol TCP `
    -Action Allow `
    -Description "Autorise les connexions sortantes sur le port 8002 pour FastAPI"

Write-Host "✅ Règles de firewall créées avec succès !" -ForegroundColor Green
Write-Host "Le port 8002 est maintenant ouvert pour les connexions entrantes et sortantes." -ForegroundColor Green



