#!/usr/bin/env tsx
/**
 * Script de synchronisation des traductions
 *
 * Détecte les clés manquantes dans les fichiers de traduction
 * et les ajoute avec la valeur anglaise comme placeholder
 *
 * Usage: npm run i18n:sync
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
 * Récupère une valeur dans un objet imbriqué via un chemin
 */
function getNestedValue(obj: TranslationObject, path: string): any {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[key];
  }

  return current;
}

/**
 * Définit une valeur dans un objet imbriqué via un chemin
 */
function setNestedValue(
  obj: TranslationObject,
  path: string,
  value: any
): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    // Si la clé existe mais n'est pas un objet, on la remplace par un objet
    if (current[keys[i]] && typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Synchronise un fichier de traduction avec le fichier source
 */
function syncTranslationFile(
  sourceFile: string,
  targetFile: string,
  targetLang: string
): void {
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Fichier source introuvable: ${sourceFile}`);
    return;
  }

  const source: TranslationObject = JSON.parse(
    fs.readFileSync(sourceFile, 'utf-8')
  );

  let target: TranslationObject = {};
  if (fs.existsSync(targetFile)) {
    target = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
  }

  const sourceKeys = getAllKeys(source);
  const targetKeys = getAllKeys(target);
  const missingKeys = sourceKeys.filter((key) => !targetKeys.includes(key));

  if (missingKeys.length === 0) {
    console.log(
      `✅ ${targetLang}.json: Toutes les traductions sont synchronisées!`
    );
    return;
  }

  console.log(
    `\n📝 ${targetLang}.json: ${missingKeys.length} clé(s) manquante(s):`
  );

  let added = 0;
  for (const key of missingKeys) {
    const sourceValue = getNestedValue(source, key);
    setNestedValue(target, key, sourceValue);
    console.log(`  + ${key}`);
    added++;
  }

  // Écrire le fichier avec une indentation de 2 espaces
  fs.writeFileSync(targetFile, JSON.stringify(target, null, 2) + '\n', 'utf-8');

  console.log(
    `\n✅ ${targetLang}.json: ${added} clé(s) ajoutée(s) avec la valeur anglaise comme placeholder\n`
  );
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔄 Synchronisation des traductions...\n');

  const sourcePath = path.join(messagesDir, `${sourceLang}.json`);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Fichier source introuvable: ${sourcePath}`);
    process.exit(1);
  }

  // Lire le fichier source pour obtenir la liste des langues
  // On synchronise toutes les langues sauf l'anglais
  const files = fs.readdirSync(messagesDir);
  const translationFiles = files.filter(
    (file) => file.endsWith('.json') && file !== `${sourceLang}.json`
  );

  if (translationFiles.length === 0) {
    console.log('ℹ️  Aucun fichier de traduction trouvé.');
    return;
  }

  for (const file of translationFiles) {
    const lang = file.replace('.json', '');
    const targetPath = path.join(messagesDir, file);
    syncTranslationFile(sourcePath, targetPath, lang);
  }

  console.log('✨ Synchronisation terminée!\n');
}

main();
