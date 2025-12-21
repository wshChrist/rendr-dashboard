# Script PowerShell pour configurer le firewall pour MetaTrader 4
# À exécuter en tant qu'administrateur

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Configuration du firewall pour MetaTrader 4" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Trouver MetaTrader
Write-Host "1. Recherche de MetaTrader..." -ForegroundColor Yellow
$mt4Paths = @(
    "${env:ProgramFiles}\MetaTrader 4\terminal.exe",
    "${env:ProgramFiles(x86)}\MetaTrader 4\terminal.exe",
    "${env:ProgramFiles}\MetaTrader 5\terminal64.exe",
    "${env:ProgramFiles(x86)}\MetaTrader 5\terminal64.exe"
)

$mt4Path = $null
foreach ($path in $mt4Paths) {
    if (Test-Path $path) {
        $mt4Path = $path
        Write-Host "   ✅ Trouvé: $path" -ForegroundColor Green
        break
    }
}

if (-not $mt4Path) {
    Write-Host "   ⚠️  MetaTrader non trouvé dans les emplacements standards" -ForegroundColor Yellow
    Write-Host "   Recherche dans les processus en cours..." -ForegroundColor Yellow
    
    $mt4Process = Get-Process | Where-Object {
        $_.ProcessName -like "*terminal*" -or 
        $_.ProcessName -like "*meta*" -or
        $_.MainWindowTitle -like "*MetaTrader*"
    } | Select-Object -First 1
    
    if ($mt4Process) {
        $mt4Path = $mt4Process.Path
        Write-Host "   ✅ Trouvé via processus: $mt4Path" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MetaTrader non trouvé. Veuillez le démarrer ou spécifier le chemin manuellement." -ForegroundColor Red
        $mt4Path = Read-Host "   Entrez le chemin complet vers terminal.exe"
    }
}

# 2. Créer une règle pour MetaTrader (sortant)
Write-Host ""
Write-Host "2. Création de la règle de firewall pour MetaTrader (sortant)..." -ForegroundColor Yellow

$ruleName = "MetaTrader - Autoriser connexions sortantes"
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "   ⚠️  La règle existe déjà. Suppression..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $ruleName
}

try {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Outbound `
        -Program $mt4Path `
        -Action Allow `
        -Description "Autorise MetaTrader à établir des connexions sortantes (pour WebRequest)" `
        -Profile Any
    
    Write-Host "   ✅ Règle créée avec succès" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur lors de la création de la règle: $_" -ForegroundColor Red
}

# 3. Créer une règle pour le port 8001 (entrant)
Write-Host ""
Write-Host "3. Création de la règle de firewall pour le port 8001 (entrant)..." -ForegroundColor Yellow

$portRuleName = "FastAPI Port 8001 - Entrant"
$existingPortRule = Get-NetFirewallRule -DisplayName $portRuleName -ErrorAction SilentlyContinue

if ($existingPortRule) {
    Write-Host "   ⚠️  La règle existe déjà. Suppression..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $portRuleName
}

try {
    New-NetFirewallRule -DisplayName $portRuleName `
        -Direction Inbound `
        -LocalPort 8001 `
        -Protocol TCP `
        -Action Allow `
        -Description "Autorise les connexions entrantes sur le port 8001 pour FastAPI" `
        -Profile Any
    
    Write-Host "   ✅ Règle créée avec succès" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur lors de la création de la règle: $_" -ForegroundColor Red
}

# 4. Vérifier les règles
Write-Host ""
Write-Host "4. Vérification des règles créées..." -ForegroundColor Yellow

$rules = Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*MetaTrader*" -or 
    $_.DisplayName -like "*FastAPI*" -or
    $_.DisplayName -like "*Port 8001*"
}

if ($rules) {
    Write-Host "   Règles trouvées:" -ForegroundColor Cyan
    $rules | ForEach-Object {
        $status = if ($_.Enabled) { "✅ Activée" } else { "❌ Désactivée" }
        Write-Host "   - $($_.DisplayName): $status ($($_.Direction))" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  Aucune règle trouvée" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Redémarrer MetaTrader en tant qu'administrateur" -ForegroundColor White
Write-Host "2. Vérifier que l'URL est dans la liste blanche MetaTrader" -ForegroundColor White
Write-Host "3. Tester l'EA" -ForegroundColor White


