# Script de test pour vérifier la connexion EA
Write-Host "Test de connexion à l'API EA..." -ForegroundColor Cyan

# Test 1: Vérifier que le serveur répond
Write-Host "`n1. Test de connexion au serveur..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/trades/register" -Method POST -ContentType "application/json" -Body '{"account_number":123456,"server":"TestServer","platform":"MT4"}' -ErrorAction Stop
    Write-Host "✅ Serveur accessible - Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Réponse: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Code HTTP: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

# Test 2: Vérifier avec 127.0.0.1
Write-Host "`n2. Test avec 127.0.0.1..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/trades/register" -Method POST -ContentType "application/json" -Body '{"account_number":123456,"server":"TestServer","platform":"MT4"}' -ErrorAction Stop
    Write-Host "✅ Serveur accessible via 127.0.0.1 - Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur avec 127.0.0.1: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Vérifier le port
Write-Host "`n3. Vérification du port 3000..." -ForegroundColor Yellow
$port = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
if ($port) {
    Write-Host "✅ Port 3000 ouvert" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3000 fermé ou inaccessible" -ForegroundColor Red
}

Write-Host "`nTest terminé." -ForegroundColor Cyan


