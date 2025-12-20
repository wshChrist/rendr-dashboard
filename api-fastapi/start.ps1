# Script PowerShell pour démarrer FastAPI
Write-Host "Démarrage de l'API FastAPI..." -ForegroundColor Cyan

# Vérifier que Python est installé
try {
    $pythonVersion = python --version
    Write-Host "Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Changer de répertoire
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Vérifier que les dépendances sont installées
Write-Host "Vérification des dépendances..." -ForegroundColor Yellow
try {
    python -c "import fastapi, uvicorn, httpx, pydantic" 2>$null
    Write-Host "✅ Dépendances installées" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Installation des dépendances..." -ForegroundColor Yellow
    pip install fastapi uvicorn[standard] httpx pydantic
}

# Démarrer FastAPI
Write-Host "`n🚀 Démarrage de FastAPI sur http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "Testez dans votre navigateur: http://127.0.0.1:8000/api/test" -ForegroundColor Yellow
Write-Host "Appuyez sur Ctrl+C pour arrêter`n" -ForegroundColor Gray

uvicorn main:app --reload --host 0.0.0.0 --port 8000
