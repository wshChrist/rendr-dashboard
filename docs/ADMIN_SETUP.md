# Guide : Comment devenir administrateur

Ce guide explique comment donner les droits administrateur à un compte utilisateur pour accéder à la page d'administration.

## Méthode 1 : Via l'API (Recommandé pour le développement)

### Étape 1 : Utiliser la route API

Une route API a été créée pour faciliter la définition du rôle admin : `/api/admin/set-admin`

#### Option A : Script PowerShell (Windows - Recommandé)

```powershell
.\scripts\set-admin.ps1 -Email "votre@email.com"
```

#### Option B : Script Batch (Windows)

```cmd
scripts\set-admin.bat votre@email.com
```

#### Option C : Script Node.js (Multi-plateforme)

```bash
node scripts/set-admin.js votre@email.com
```

#### Option D : curl (Linux/Mac)

```bash
curl -X POST http://localhost:3000/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "votre@email.com"}'
```

#### Option E : curl sur Windows (PowerShell)

```powershell
$body = '{"email":"votre@email.com"}' | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/set-admin" -Method POST -ContentType "application/json" -Body $body
```

#### Option F : curl sur Windows (CMD avec fichier JSON)

Créez un fichier `body.json` :
```json
{"email": "votre@email.com"}
```

Puis exécutez :
```cmd
curl -X POST http://localhost:3000/api/admin/set-admin -H "Content-Type: application/json" -d @body.json
```

Ou avec `userId` :

```bash
curl -X POST http://localhost:3000/api/admin/set-admin \
  -H "Content-Type: application/json" \
  -d '{"userId": "uuid-de-l-utilisateur"}'
```

### Étape 2 : Vérifier le résultat

Si tout s'est bien passé, vous devriez recevoir une réponse comme :

```json
{
  "success": true,
  "message": "Rôle admin défini avec succès",
  "userId": "...",
  "email": "votre@email.com",
  "role": "admin"
}
```

### Étape 3 : Se déconnecter et reconnecter

Pour que les changements prennent effet, vous devez vous déconnecter et vous reconnecter à votre compte.

## Méthode 2 : Via le Dashboard Supabase (Recommandé pour la production)

### Étape 1 : Accéder au Dashboard Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre projet

### Étape 2 : Naviguer vers Authentication > Users

1. Dans le menu de gauche, cliquez sur **Authentication**
2. Cliquez sur **Users**

### Étape 3 : Trouver votre utilisateur

1. Recherchez votre utilisateur par email
2. Cliquez sur l'utilisateur pour ouvrir ses détails

### Étape 4 : Modifier les métadonnées utilisateur

1. Dans la section **User Metadata**, cliquez sur **Edit**
2. Ajoutez ou modifiez la clé `role` avec la valeur `admin`
3. Le JSON devrait ressembler à :

```json
{
  "role": "admin",
  "first_name": "Votre prénom",
  "last_name": "Votre nom",
  ...
}
```

4. Cliquez sur **Save**

### Étape 5 : Se déconnecter et reconnecter

Pour que les changements prennent effet, vous devez vous déconnecter et vous reconnecter à votre compte.

## Méthode 3 : Via SQL (Pour les utilisateurs avancés)

Si vous avez accès à la base de données Supabase directement :

### Étape 1 : Accéder à l'éditeur SQL

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** dans le menu de gauche
4. Cliquez sur **New query**

### Étape 2 : Exécuter la commande SQL

**Option A : Mettre à jour par email (Recommandé)**

```sql
-- Mettre à jour les métadonnées pour ajouter le rôle admin
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'peka0190@gmail.com';

-- Vérifier que la mise à jour a fonctionné
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'peka0190@gmail.com';
```

**Option B : Mettre à jour par ID utilisateur**

```sql
-- D'abord, trouver l'ID de l'utilisateur
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'peka0190@gmail.com';

-- Puis mettre à jour avec l'ID (remplacez 'user-id-here' par l'ID réel)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = 'user-id-here';
```

**Option C : Mettre à jour tous les utilisateurs (⚠️ Attention !)**

```sql
-- Mettre tous les utilisateurs en admin (à utiliser avec précaution)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
```

### Étape 3 : Vérifier le résultat

```sql
-- Voir tous les utilisateurs avec leur rôle
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;
```

### Étape 4 : Se déconnecter et reconnecter

Pour que les changements prennent effet, vous devez vous déconnecter et vous reconnecter à votre compte.

## Vérification

Après avoir défini le rôle admin, vous pouvez vérifier que cela fonctionne :

1. **Déconnectez-vous** de votre compte
2. **Reconnectez-vous**
3. Vous devriez maintenant voir le menu **"Administration"** dans la sidebar
4. Vous pouvez accéder à `/dashboard/admin` ou `/dashboard/admin/overview`

## Sécurité

⚠️ **Important** : En production, la route API `/api/admin/set-admin` devrait être protégée par :
- Un token secret
- Une vérification d'IP
- Ou être désactivée complètement

Pour l'instant, cette route est accessible à tous. Assurez-vous de la sécuriser avant de déployer en production.

## Dépannage

### Le menu Administration n'apparaît pas

1. Vérifiez que vous êtes bien déconnecté et reconnecté
2. Vérifiez dans le Dashboard Supabase que `user_metadata.role` est bien défini à `"admin"`
3. Vérifiez la console du navigateur pour d'éventuelles erreurs

### Erreur 403 lors de l'accès à `/dashboard/admin`

1. Vérifiez que le rôle est bien défini dans les métadonnées utilisateur
2. Videz le cache du navigateur
3. Vérifiez que vous êtes bien connecté avec le bon compte

