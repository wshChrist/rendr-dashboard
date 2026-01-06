@echo off
REM Script batch pour définir un utilisateur comme administrateur
REM Usage: scripts\set-admin.bat user@example.com

if "%~1"=="" (
    echo Erreur: Veuillez fournir un email
    echo.
    echo Usage: scripts\set-admin.bat ^<email^>
    echo Exemple: scripts\set-admin.bat user@example.com
    exit /b 1
)

set EMAIL=%~1
set API_URL=http://localhost:3000

echo [Définition du rôle admin pour: %EMAIL%...]

REM Créer un fichier JSON temporaire
echo {"email":"%EMAIL%"} > %TEMP%\set-admin-body.json

REM Faire la requête avec curl
curl -X POST "%API_URL%/api/admin/set-admin" ^
  -H "Content-Type: application/json" ^
  -d "@%TEMP%\set-admin-body.json"

REM Nettoyer
del %TEMP%\set-admin-body.json

echo.
echo Note: Vous devez vous deconnecter et reconnecter pour que les changements prennent effet.

