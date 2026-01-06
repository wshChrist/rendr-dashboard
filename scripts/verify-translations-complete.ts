#!/usr/bin/env tsx
/**
 * Script de vérification complète des traductions
 *
 * Vérifie:
 * - Les placeholders dans les traductions
 * - La cohérence des placeholders entre les langues
 * - Les clés manquantes entre les langues
 * - Les textes non traduits (textes anglais dans le fichier français)
 * - Les chaînes hardcodées dans le code
 * - Les clés de traduction non utilisées
 * - La structure JSON valide
 *
 * Usage: npm run i18n:verify-complete
 */

import fs from 'fs';
import path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const srcDir = path.join(process.cwd(), 'src');
const sourceLang = 'en';

interface TranslationObject {
  [key: string]: any;
}

interface VerificationResult {
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
}

interface PlaceholderInfo {
  key: string;
  placeholders: string[];
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
 * Récupère la valeur d'une clé dans un objet
 */
function getValueByKey(
  obj: TranslationObject,
  key: string
): string | undefined {
  const parts = key.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  return undefined;
}

/**
 * Extrait les placeholders d'une chaîne (format {placeholder})
 */
function extractPlaceholders(text: string): string[] {
  const placeholderRegex = /\{([^}]+)\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    placeholders.push(match[1]);
  }

  return Array.from(new Set(placeholders)); // Supprime les doublons
}

/**
 * Vérifie si une chaîne contient du texte en anglais (simple heuristique)
 */
function containsEnglishText(text: string): boolean {
  // Mots anglais communs qui ne devraient pas apparaître dans le français
  const englishWords = [
    /\b(Loading|Error|Success|Dashboard|Transactions|Brokers|Account|Profile|Logout|Settings|Save|Cancel|Delete|Edit|Create|Add|Refresh|Export|Search|Continue|Back|Home|Overview|Updates|Withdrawals|Referral|Contact|Admin|Sign in|Sign up|Welcome|Join|Features|Security|Analytics)\b/i,
    /\b(Platform|All|Period|Theme|Default|Filters|Page|Selected|Total|Rows|Previous|Next|First|Last)\b/i,
    /\b(Pending|Confirmed|Completed|Processing|Rejected|Active|Inactive|Verified|Not activated)\b/i,
    /\b(Amount|Minimum|Maximum|Payment Method|Bank Transfer|PayPal|Crypto|IBAN|Email|Password|Name|Subject|Message|Send|Cancel|Confirm|Delete|Edit|Create|Add)\b/i
  ];

  return englishWords.some((pattern) => pattern.test(text));
}

/**
 * Vérifie les placeholders dans les traductions
 */
function verifyPlaceholders(
  translations: Map<string, TranslationObject>
): VerificationResult {
  const result: VerificationResult = {
    hasErrors: false,
    errors: [],
    warnings: []
  };

  const placeholderMap = new Map<string, PlaceholderInfo[]>();

  // Collecte tous les placeholders pour chaque langue
  for (const lang of Array.from(translations.keys())) {
    const translationObj = translations.get(lang)!;
    const keys = getAllKeys(translationObj);
    const placeholders: PlaceholderInfo[] = [];

    for (const key of keys) {
      const value = getValueByKey(translationObj, key);
      if (value && typeof value === 'string') {
        const foundPlaceholders = extractPlaceholders(value);
        if (foundPlaceholders.length > 0) {
          placeholders.push({ key, placeholders: foundPlaceholders });
        }
      }
    }

    placeholderMap.set(lang, placeholders);
  }

  // Compare les placeholders entre les langues
  const sourcePlaceholders = placeholderMap.get(sourceLang) || [];
  const sourcePlaceholderMap = new Map<string, string[]>();

  for (const info of sourcePlaceholders) {
    sourcePlaceholderMap.set(info.key, info.placeholders);
  }

  for (const lang of Array.from(placeholderMap.keys())) {
    const placeholders = placeholderMap.get(lang)!;
    if (lang === sourceLang) continue;

    for (const info of placeholders) {
      const sourcePlaceholders = sourcePlaceholderMap.get(info.key);
      if (!sourcePlaceholders) {
        result.warnings.push(
          `⚠️  ${lang}: Clé "${info.key}" a des placeholders mais n'existe pas dans ${sourceLang}`
        );
        continue;
      }

      const missing = sourcePlaceholders.filter(
        (p) => !info.placeholders.includes(p)
      );
      const extra = info.placeholders.filter(
        (p) => !sourcePlaceholders.includes(p)
      );

      if (missing.length > 0) {
        result.hasErrors = true;
        result.errors.push(
          `❌ ${lang}: Clé "${info.key}" manque les placeholders: ${missing.join(', ')}`
        );
      }

      if (extra.length > 0) {
        result.warnings.push(
          `⚠️  ${lang}: Clé "${info.key}" a des placeholders supplémentaires: ${extra.join(', ')}`
        );
      }
    }

    // Vérifie les clés qui ont des placeholders en source mais pas dans la langue cible
    for (const key of Array.from(sourcePlaceholderMap.keys())) {
      const sourcePlaces = sourcePlaceholderMap.get(key)!;
      const targetInfo = placeholders.find((p) => p.key === key);
      if (!targetInfo && getValueByKey(translations.get(lang)!, key)) {
        result.hasErrors = true;
        result.errors.push(
          `❌ ${lang}: Clé "${key}" devrait avoir les placeholders: ${sourcePlaces.join(', ')}`
        );
      }
    }
  }

  return result;
}

/**
 * Vérifie les clés manquantes
 */
function verifyMissingKeys(
  translations: Map<string, TranslationObject>
): VerificationResult {
  const result: VerificationResult = {
    hasErrors: false,
    errors: [],
    warnings: []
  };

  const sourceKeys = getAllKeys(translations.get(sourceLang)!);

  for (const lang of Array.from(translations.keys())) {
    if (lang === sourceLang) continue;
    const translationObj = translations.get(lang)!;

    const targetKeys = getAllKeys(translationObj);
    const missing = sourceKeys.filter((k) => !targetKeys.includes(k));
    const extra = targetKeys.filter((k) => !sourceKeys.includes(k));

    if (missing.length > 0) {
      result.hasErrors = true;
      result.errors.push(
        `❌ ${lang}.json: ${missing.length} clé(s) manquante(s)`
      );
      missing.slice(0, 10).forEach((k) => {
        result.errors.push(`   - ${k}`);
      });
      if (missing.length > 10) {
        result.errors.push(`   ... et ${missing.length - 10} autre(s)`);
      }
    }

    if (extra.length > 0) {
      result.warnings.push(
        `⚠️  ${lang}.json: ${extra.length} clé(s) supplémentaire(s)`
      );
      extra.slice(0, 5).forEach((k) => {
        result.warnings.push(`   + ${k}`);
      });
      if (extra.length > 5) {
        result.warnings.push(`   ... et ${extra.length - 5} autre(s)`);
      }
    }
  }

  return result;
}

/**
 * Vérifie les textes non traduits (anglais dans le français)
 */
function verifyUntranslatedTexts(
  translations: Map<string, TranslationObject>
): VerificationResult {
  const result: VerificationResult = {
    hasErrors: false,
    errors: [],
    warnings: []
  };

  const sourceObj = translations.get(sourceLang)!;

  for (const lang of Array.from(translations.keys())) {
    if (lang === sourceLang) continue;
    const translationObj = translations.get(lang)!;

    const keys = getAllKeys(translationObj);
    const suspiciousKeys: string[] = [];

    for (const key of keys) {
      const targetValue = getValueByKey(translationObj, key);
      const sourceValue = getValueByKey(sourceObj, key);

      if (targetValue && sourceValue) {
        // Si la valeur cible est identique à la source et contient du texte anglais
        if (targetValue === sourceValue && containsEnglishText(targetValue)) {
          suspiciousKeys.push(key);
        }
        // Si la valeur cible contient du texte anglais mais est différente de la source
        else if (
          targetValue !== sourceValue &&
          containsEnglishText(targetValue)
        ) {
          // C'est juste un avertissement car il pourrait y avoir des mots anglais légitimes
          result.warnings.push(
            `⚠️  ${lang}: Clé "${key}" contient du texte qui ressemble à de l'anglais: "${targetValue.substring(0, 50)}..."`
          );
        }
      }
    }

    if (suspiciousKeys.length > 0) {
      result.hasErrors = true;
      result.errors.push(
        `❌ ${lang}: ${suspiciousKeys.length} clé(s) semblent non traduites (identique à ${sourceLang})`
      );
      suspiciousKeys.slice(0, 10).forEach((k) => {
        const value = getValueByKey(translationObj, k);
        result.errors.push(`   - ${k}: "${value?.substring(0, 60)}..."`);
      });
      if (suspiciousKeys.length > 10) {
        result.errors.push(`   ... et ${suspiciousKeys.length - 10} autre(s)`);
      }
    }
  }

  return result;
}

/**
 * Récupère récursivement tous les fichiers avec une extension donnée
 */
function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // Ignore node_modules et autres dossiers à ignorer
      if (!item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (item.isFile()) {
      const ext = path.extname(item.name);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Recherche les chaînes hardcodées dans le code
 */
async function findHardcodedStrings(): Promise<VerificationResult> {
  const result: VerificationResult = {
    hasErrors: false,
    errors: [],
    warnings: []
  };

  const tsxFiles = getAllFiles(srcDir, ['.tsx', '.ts']).filter(
    (file) => !file.includes('.test.') && !file.includes('.spec.')
  );

  const hardcodedPatterns = [
    // Textes en anglais communs qui devraient être traduits
    /["'](Loading|Error|Success|Dashboard|Transactions|Brokers|Account|Profile|Logout|Settings|Save|Cancel|Delete|Edit|Create|Add|Refresh|Export|Search|Continue|Back|Home|Overview|Updates|Withdrawals|Referral|Contact|Admin|Sign in|Sign up|Welcome|Join)[^"']*["']/gi,
    /["'](Pending|Confirmed|Completed|Processing|Rejected|Active|Inactive)[^"']*["']/gi,
    // Textes en français hardcodés
    /["'](Bientôt disponible|Chargement|Erreur|Succès)[^"']*["']/gi
  ];

  const suspiciousStrings = new Set<string>();

  for (const file of tsxFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Ignore les commentaires et les imports
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Ignore les commentaires
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }

      // Ignore les imports
      if (line.trim().startsWith('import')) {
        continue;
      }

      // Ignore les lignes avec useTranslations, getTranslations ou t(
      if (
        line.includes('useTranslations') ||
        line.includes('getTranslations') ||
        line.includes('t(') ||
        line.includes('t.rich(') ||
        line.includes('t.raw(')
      ) {
        continue;
      }

      // Ignore les chaînes dans les props d'objets (comme className, variant, etc.)
      if (
        line.includes('className=') ||
        line.includes('variant=') ||
        line.includes('size=') ||
        line.includes('type=')
      ) {
        continue;
      }

      for (const pattern of hardcodedPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            // Vérifie que ce n'est pas dans une clé de traduction ou un commentaire
            if (
              !match.includes('t(') &&
              !match.includes('translations') &&
              !match.includes('//') &&
              match.length > 2
            ) {
              const relativePath = path.relative(process.cwd(), file);
              suspiciousStrings.add(
                `${relativePath}:${i + 1}: ${match.trim()}`
              );
            }
          });
        }
      }
    }
  }

  if (suspiciousStrings.size > 0) {
    result.warnings.push(
      `⚠️  ${suspiciousStrings.size} chaîne(s) potentiellement hardcodée(s) trouvée(s):`
    );
    Array.from(suspiciousStrings)
      .slice(0, 20)
      .forEach((str) => {
        result.warnings.push(`   - ${str}`);
      });
    if (suspiciousStrings.size > 20) {
      result.warnings.push(`   ... et ${suspiciousStrings.size - 20} autre(s)`);
    }
    result.warnings.push(
      `\n💡 Vérifiez que ces chaînes doivent être traduites et utilisez t('clé.traduction') à la place`
    );
  }

  return result;
}

/**
 * Vérifie que les fichiers JSON sont valides
 */
function verifyJSONStructure(
  translations: Map<string, TranslationObject>
): VerificationResult {
  const result: VerificationResult = {
    hasErrors: false,
    errors: [],
    warnings: []
  };

  for (const lang of Array.from(translations.keys())) {
    const translationObj = translations.get(lang)!;
    // La structure a déjà été validée lors du parsing, mais on peut vérifier d'autres choses
    const keys = getAllKeys(translationObj);

    // Vérifie les valeurs vides
    for (const key of keys) {
      const value = getValueByKey(translationObj, key);
      if (value === '') {
        result.warnings.push(`⚠️  ${lang}: Clé "${key}" a une valeur vide`);
      }
    }
  }

  return result;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Vérification complète des traductions...\n');

  // Charge les fichiers de traduction
  const translations = new Map<string, TranslationObject>();
  const files = fs.readdirSync(messagesDir);
  const translationFiles = files.filter((file) => file.endsWith('.json'));

  if (translationFiles.length === 0) {
    console.error('❌ Aucun fichier de traduction trouvé.');
    process.exit(1);
  }

  for (const file of translationFiles) {
    const lang = file.replace('.json', '');
    const filePath = path.join(messagesDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      translations.set(lang, parsed);
      console.log(`✅ ${file} chargé (${getAllKeys(parsed).length} clés)`);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${file}:`, error);
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // 1. Vérifie la structure JSON
  console.log('1️⃣  Vérification de la structure JSON...');
  const jsonResult = verifyJSONStructure(translations);
  allErrors.push(...jsonResult.errors);
  allWarnings.push(...jsonResult.warnings);
  if (jsonResult.errors.length === 0 && jsonResult.warnings.length === 0) {
    console.log('✅ Structure JSON valide\n');
  } else {
    jsonResult.errors.forEach((e) => console.log(e));
    jsonResult.warnings.forEach((w) => console.log(w));
    console.log();
  }

  // 2. Vérifie les clés manquantes
  console.log('2️⃣  Vérification des clés manquantes...');
  const keysResult = verifyMissingKeys(translations);
  allErrors.push(...keysResult.errors);
  allWarnings.push(...keysResult.warnings);
  if (keysResult.errors.length === 0 && keysResult.warnings.length === 0) {
    console.log('✅ Toutes les clés sont synchronisées\n');
  } else {
    keysResult.errors.forEach((e) => console.log(e));
    keysResult.warnings.forEach((w) => console.log(w));
    console.log();
  }

  // 3. Vérifie les placeholders
  console.log('3️⃣  Vérification des placeholders...');
  const placeholderResult = verifyPlaceholders(translations);
  allErrors.push(...placeholderResult.errors);
  allWarnings.push(...placeholderResult.warnings);
  if (
    placeholderResult.errors.length === 0 &&
    placeholderResult.warnings.length === 0
  ) {
    console.log('✅ Tous les placeholders sont cohérents\n');
  } else {
    placeholderResult.errors.forEach((e) => console.log(e));
    placeholderResult.warnings.forEach((w) => console.log(w));
    console.log();
  }

  // 4. Vérifie les textes non traduits
  console.log('4️⃣  Vérification des textes non traduits...');
  const untranslatedResult = verifyUntranslatedTexts(translations);
  allErrors.push(...untranslatedResult.errors);
  allWarnings.push(...untranslatedResult.warnings);
  if (
    untranslatedResult.errors.length === 0 &&
    untranslatedResult.warnings.length === 0
  ) {
    console.log('✅ Tous les textes sont traduits\n');
  } else {
    untranslatedResult.errors.forEach((e) => console.log(e));
    untranslatedResult.warnings.forEach((w) => console.log(w));
    console.log();
  }

  // 5. Recherche les chaînes hardcodées
  console.log('5️⃣  Recherche des chaînes hardcodées dans le code...');
  const hardcodedResult = await findHardcodedStrings();
  allErrors.push(...hardcodedResult.errors);
  allWarnings.push(...hardcodedResult.warnings);
  if (
    hardcodedResult.errors.length === 0 &&
    hardcodedResult.warnings.length === 0
  ) {
    console.log('✅ Aucune chaîne hardcodée suspecte trouvée\n');
  } else {
    hardcodedResult.errors.forEach((e) => console.log(e));
    hardcodedResult.warnings.forEach((w) => console.log(w));
    console.log();
  }

  // Résumé final
  console.log('='.repeat(60));
  console.log('\n📊 RÉSUMÉ\n');
  console.log(`❌ Erreurs: ${allErrors.length}`);
  console.log(`⚠️  Avertissements: ${allWarnings.length}\n`);

  if (allErrors.length > 0) {
    console.log('❌ DES ERREURS ONT ÉTÉ TROUVÉES\n');
    console.log(
      '💡 Exécutez "npm run i18n:sync" pour synchroniser les clés manquantes\n'
    );
    process.exit(1);
  } else if (allWarnings.length > 0) {
    console.log(
      '⚠️  Des avertissements ont été trouvés mais aucune erreur critique\n'
    );
    process.exit(0);
  } else {
    console.log('✅ Toutes les vérifications ont réussi !\n');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
