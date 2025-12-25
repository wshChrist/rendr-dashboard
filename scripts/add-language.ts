#!/usr/bin/env tsx
/**
 * Script pour ajouter une nouvelle langue
 *
 * Crée un nouveau fichier de traduction basé sur l'anglais
 *
 * Usage: npm run i18n:add-lang <lang>
 * Exemple: npm run i18n:add-lang es
 */

import fs from 'fs';
import path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const sourceLang = 'en';

function main() {
  const newLang = process.argv[2];

  if (!newLang) {
    console.error('❌ Usage: npm run i18n:add-lang <lang>');
    console.error('   Exemple: npm run i18n:add-lang es');
    process.exit(1);
  }

  // Valider le format de la langue (2 lettres)
  if (!/^[a-z]{2}$/i.test(newLang)) {
    console.error(
      '❌ Le code de langue doit être composé de 2 lettres (ex: es, de, it)'
    );
    process.exit(1);
  }

  const sourcePath = path.join(messagesDir, `${sourceLang}.json`);
  const newPath = path.join(messagesDir, `${newLang}.json`);

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Fichier source introuvable: ${sourcePath}`);
    process.exit(1);
  }

  if (fs.existsSync(newPath)) {
    console.error(`❌ La langue ${newLang} existe déjà!`);
    process.exit(1);
  }

  // Copier le fichier source
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  fs.writeFileSync(newPath, JSON.stringify(source, null, 2) + '\n', 'utf-8');

  console.log(`✅ Fichier ${newLang}.json créé à partir de ${sourceLang}.json`);
  console.log(
    `\n📝 N'oubliez pas d'ajouter "${newLang}" dans src/i18n/routing.ts:`
  );
  console.log(`   locales: ['fr', 'en', '${newLang}']`);
  console.log(
    `\n💡 Exécutez "npm run i18n:sync" pour synchroniser toutes les langues\n`
  );
}

main();
