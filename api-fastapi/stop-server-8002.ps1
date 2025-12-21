# Script PowerShell pour arrêter tous les serveurs FastAPI/uvicorn sur le port 8002

Write-Host "Recherche des processus utilisant le port 8002..." -ForegroundColor Yellow

# Trouver les processus utilisant le port 8002
$connections = Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object {
        $pid = $_.OwningProcess
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  PID: $pid - $($process.ProcessName) - $($process.Path)" -ForegroundColor Cyan
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅ Arrêté" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Aucun processus trouvé sur le port 8002." -ForegroundColor Yellow
}

# Vérification finale
Start-Sleep -Seconds 1
$finalCheck = Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue
if ($finalCheck) {
    Write-Host "⚠️  Le port 8002 est toujours utilisé" -ForegroundColor Red
} else {
    Write-Host "✅ Le port 8002 est libre !" -ForegroundColor Green
}


