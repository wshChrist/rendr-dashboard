# Script PowerShell pour définir un utilisateur comme administrateur
# Usage: .\scripts\set-admin.ps1 -Email "user@example.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$apiUrl = $env:NEXT_PUBLIC_API_URL
if (-not $apiUrl) {
    $apiUrl = "http://localhost:3000"
}

$body = @{
    email = $Email
} | ConvertTo-Json

Write-Host "🔄 Définition du rôle admin pour: $Email..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$apiUrl/api/admin/set-admin" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json

    if ($data.success) {
        Write-Host "✅ Succès!" -ForegroundColor Green
        Write-Host "   - Email: $($data.email)"
        Write-Host "   - User ID: $($data.userId)"
        Write-Host "   - Rôle: $($data.role)"
        Write-Host ""
        Write-Host "📝 Note: Vous devez vous déconnecter et reconnecter pour que les changements prennent effet." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erreur: $($data.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de la requête:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse du serveur: $responseBody" -ForegroundColor Red
    }
    
    exit 1
}

