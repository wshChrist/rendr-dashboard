# Script PowerShell pour démarrer FastAPI
# Essaie le port 8001 si 8000 est occupé

Write-Host "Démarrage de FastAPI..." -ForegroundColor Yellow

# Vérifier si le port 8000 est libre
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "⚠️  Le port 8000 est occupé, utilisation du port 8001" -ForegroundColor Yellow
    $port = 8001
} else {
    Write-Host "✅ Le port 8000 est libre" -ForegroundColor Green
    $port = 8000
}

Write-Host "Démarrage sur le port $port..." -ForegroundColor Cyan
Write-Host "URL: http://192.168.1.142:$port" -ForegroundColor Cyan
Write-Host ""

# Démarrer uvicorn
uvicorn main:app --host 0.0.0.0 --port $port



