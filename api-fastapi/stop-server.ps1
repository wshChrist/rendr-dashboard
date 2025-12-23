# Script PowerShell pour arrêter tous les serveurs FastAPI/uvicorn
# À exécuter si le port 8000 est occupé

Write-Host "Recherche des processus uvicorn/python utilisant le port 8000..." -ForegroundColor Yellow

# Trouver les processus uvicorn
$uvicornProcesses = Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue
if ($uvicornProcesses) {
    Write-Host "Processus uvicorn trouvés:" -ForegroundColor Yellow
    $uvicornProcesses | ForEach-Object {
        Write-Host "  PID: $($_.Id) - $($_.ProcessName)" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
        Write-Host "  ✅ Arrêté" -ForegroundColor Green
    }
} else {
    Write-Host "Aucun processus uvicorn trouvé." -ForegroundColor Yellow
}

# Trouver les processus Python qui pourraient utiliser le port 8000
$pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "`nProcessus Python trouvés:" -ForegroundColor Yellow
    $pythonProcesses | ForEach-Object {
        $port = netstat -ano | findstr $_.Id | findstr ":8000"
        if ($port) {
            Write-Host "  PID: $($_.Id) - Utilise le port 8000" -ForegroundColor Red
            Write-Host "  Voulez-vous l'arrêter ? (O/N)" -ForegroundColor Yellow
            # Pour automatique, on arrête tous les python.exe (attention!)
            # Stop-Process -Id $_.Id -Force
            Write-Host "  ⚠️  Utilisez: taskkill /F /PID $($_.Id)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nVérification du port 8000..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":8000"
if ($portCheck) {
    Write-Host "⚠️  Le port 8000 est toujours utilisé:" -ForegroundColor Red
    Write-Host $portCheck
} else {
    Write-Host "✅ Le port 8000 est libre !" -ForegroundColor Green
}



