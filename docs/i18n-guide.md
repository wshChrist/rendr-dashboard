# Guide de gestion des traductions

Ce guide explique comment gérer les traductions dans le projet RendR de manière efficace et maintenable.

## 🎯 Principe : Fallback automatique

Le système utilise un **fallback automatique vers l'anglais**. Si une traduction manque dans une langue, l'anglais sera automatiquement utilisé. Cela signifie que :

- ✅ Vous pouvez ajouter de nouvelles clés en anglais sans casser les autres langues
- ✅ Les traductions manquantes afficheront l'anglais au lieu d'une erreur
- ✅ Vous pouvez traduire progressivement sans bloquer le développement

## 📁 Structure des fichiers

```
messages/
├── en.json    # Source (anglais) - TOUJOURS complet
├── fr.json    # Traduction française
├── es.json    # Traduction espagnole (exemple)
└── ...
```

## 🔑 Structure des clés

### Clés génériques réutilisables

Utilisez les clés de `common.actions.*` et `common.status.*` pour éviter la duplication :

```typescript
// ✅ Bon - Réutilisable
t('common.actions.add')
t('common.actions.edit')
t('common.actions.delete')
t('common.actions.refresh')
t('common.actions.export')

// ❌ Éviter - Spécifique et dupliqué
t('brokers.refresh')
t('transactions.refresh')
t('profile.refresh')
```

### Organisation par domaine

Les clés sont organisées par domaine fonctionnel :

- `common.*` - Actions, statuts, messages génériques
- `nav.*` - Navigation
- `auth.*` - Authentification
- `pages.*` - Contenu spécifique aux pages
- `profile.*` - Profil utilisateur
- `transactions.*` - Transactions
- `brokers.*` - Brokers
- etc.

## 🛠️ Scripts disponibles

### Synchroniser les traductions

Détecte et ajoute automatiquement les clés manquantes avec la valeur anglaise :

```bash
npm run i18n:sync
```

**Quand l'utiliser :**
- Après avoir ajouté de nouvelles clés en anglais
- Avant de commiter des changements de traduction
- Pour préparer une nouvelle langue

### Vérifier les traductions

Vérifie que toutes les langues ont les mêmes clés :

```bash
npm run i18n:check
```

**Quand l'utiliser :**
- Dans votre CI/CD pour valider les traductions
- Avant de déployer
- Pour identifier les clés manquantes

### Ajouter une nouvelle langue

Crée un nouveau fichier de traduction basé sur l'anglais :

```bash
npm run i18n:add-lang es
```

**Puis :**
1. Ajoutez la langue dans `src/i18n/routing.ts` :
   ```typescript
   locales: ['fr', 'en', 'es']
   ```
2. Synchronisez toutes les langues :
   ```bash
   npm run i18n:sync
   ```

## 📝 Workflow recommandé

### Développement quotidien

1. **Ajoutez/modifiez les clés en anglais** dans `messages/en.json`
2. **Synchronisez** pour créer les placeholders dans les autres langues :
   ```bash
   npm run i18n:sync
   ```
3. **Traduisez** dans les fichiers de langue concernés
4. **Vérifiez** avant de commiter :
   ```bash
   npm run i18n:check
   ```

### Ajouter une nouvelle fonctionnalité

1. Ajoutez toutes les clés nécessaires en anglais
2. Exécutez `npm run i18n:sync`
3. Traduisez dans les langues supportées
4. Le fallback automatique garantit que tout fonctionne même si une traduction manque

### Ajouter une nouvelle langue

1. Créez le fichier : `npm run i18n:add-lang <code>`
2. Ajoutez dans `src/i18n/routing.ts`
3. Synchronisez : `npm run i18n:sync`
4. Traduisez progressivement (l'anglais sera utilisé en fallback)

## 🎨 Utilisation dans le code

### Hook useTranslations

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations();
  
  return (
    <button>{t('common.actions.save')}</button>
  );
}
```

### Interpolation de variables

```typescript
// Dans messages/en.json
{
  "brokers": {
    "accountRefreshed": "Account {broker} has been updated."
  }
}

// Dans le code
t('brokers.accountRefreshed', { broker: brokerName })
```

### Clés avec fallback

Si une clé n'existe pas, utilisez une valeur par défaut :

```typescript
t('some.key', { defaultValue: 'Default text' })
```

## 🔍 Extension VS Code : i18n Ally

L'extension **i18n Ally** est configurée pour améliorer votre expérience de développement :

- **Aperçu des traductions** au survol des clés
- **Détection des clés manquantes** en temps réel
- **Navigation rapide** vers les fichiers de traduction
- **Édition inline** des traductions

**Installation :**
1. Ouvrez VS Code
2. Extensions > Rechercher "i18n Ally"
3. Installez l'extension
4. Redémarrez VS Code

## ✅ Bonnes pratiques

### 1. Utilisez des clés génériques

```typescript
// ✅ Bon
t('common.actions.add')
t('common.status.loading')

// ❌ Éviter
t('brokers.add')
t('transactions.add')
t('profile.add')
```

### 2. Organisez par domaine

```json
{
  "brokers": {
    "addAccount": "Add an account",
    "refresh": "Refresh"
  }
}
```

### 3. Gardez l'anglais à jour

L'anglais est la source de vérité. Toujours :
- Ajouter les nouvelles clés en anglais d'abord
- Synchroniser avec `npm run i18n:sync`
- Puis traduire dans les autres langues

### 4. Vérifiez avant de commiter

```bash
npm run i18n:check
```

## 🚨 Dépannage

### Une traduction ne s'affiche pas

1. Vérifiez que la clé existe dans `en.json`
2. Vérifiez l'orthographe exacte de la clé
3. Exécutez `npm run i18n:sync` pour synchroniser
4. Le fallback vers l'anglais devrait s'afficher automatiquement

### Erreur "Translation key not found"

Cela ne devrait plus arriver avec le fallback automatique. Si c'est le cas :
1. Vérifiez que `en.json` contient la clé
2. Vérifiez la syntaxe du fichier JSON
3. Redémarrez le serveur de développement

### Les traductions ne se mettent pas à jour

1. Videz le cache Next.js : `rm -rf .next`
2. Redémarrez le serveur de développement
3. Vérifiez que les fichiers JSON sont valides

## 📚 Ressources

- [Documentation next-intl](https://next-intl-docs.vercel.app/)
- [Extension i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally)
- [Guide TypeScript pour i18n](https://next-intl-docs.vercel.app/docs/usage/typescript)

