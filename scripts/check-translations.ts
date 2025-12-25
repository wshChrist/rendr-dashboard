#!/usr/bin/env tsx
/**
 * Script de vérification des traductions
 *
 * Vérifie que tous les fichiers de traduction ont les mêmes clés
 * que le fichier source (anglais)
 *
 * Usage: npm run i18n:check
 */

import fs from 'fs';
import path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const sourceLang = 'en';

interface TranslationObject {
  [key: string]: any;
}

/**
 * Récupère toutes les clés d'un objet de manière récursive
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof obj[key] === 'object' &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys.push(...getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔍 Vérification des traductions...\n');

  const sourcePath = path.join(messagesDir, `${sourceLang}.json`);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Fichier source introuvable: ${sourcePath}`);
    process.exit(1);
  }

  const source: TranslationObject = JSON.parse(
    fs.readFileSync(sourcePath, 'utf-8')
  );
  const sourceKeys = getAllKeys(source);

  console.log(
    `📊 Fichier source (${sourceLang}.json): ${sourceKeys.length} clé(s)\n`
  );

  const files = fs.readdirSync(messagesDir);
  const translationFiles = files.filter(
    (file) => file.endsWith('.json') && file !== `${sourceLang}.json`
  );

  if (translationFiles.length === 0) {
    console.log('ℹ️  Aucun fichier de traduction trouvé.');
    return;
  }

  let hasErrors = false;

  for (const file of translationFiles) {
    const lang = file.replace('.json', '');
    const filePath = path.join(messagesDir, file);
    const target: TranslationObject = JSON.parse(
      fs.readFileSync(filePath, 'utf-8')
    );
    const targetKeys = getAllKeys(target);

    const missing = sourceKeys.filter((k) => !targetKeys.includes(k));
    const extra = targetKeys.filter((k) => !sourceKeys.includes(k));

    if (missing.length > 0) {
      console.log(`⚠️  ${lang}.json: ${missing.length} clé(s) manquante(s)`);
      missing.slice(0, 10).forEach((k) => console.log(`   - ${k}`));
      if (missing.length > 10) {
        console.log(`   ... et ${missing.length - 10} autre(s)`);
      }
      hasErrors = true;
    }

    if (extra.length > 0) {
      console.log(
        `ℹ️  ${lang}.json: ${extra.length} clé(s) supplémentaire(s) (non présente(s) dans ${sourceLang})`
      );
      extra.slice(0, 5).forEach((k) => console.log(`   + ${k}`));
      if (extra.length > 5) {
        console.log(`   ... et ${extra.length - 5} autre(s)`);
      }
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${lang}.json: Toutes les clés sont synchronisées`);
    }
  }

  if (hasErrors) {
    console.log(
      `\n💡 Exécutez "npm run i18n:sync" pour synchroniser automatiquement\n`
    );
    process.exit(1);
  } else {
    console.log(`\n✅ Toutes les traductions sont synchronisées!\n`);
  }
}

main();
