/**
 * Utilitaires pour parser et formater les commits GitHub
 */

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export type CommitType = 'feature' | 'improvement' | 'fix' | 'announcement';

/**
 * Parse un message de commit selon le format conventional commits
 * et retourne le type, le scope, et la description
 */
export function parseCommitMessage(message: string): {
  type: CommitType | null;
  scope: string | null;
  description: string;
  body: string | null;
} {
  // Nettoyer le message (enlever les lignes multiples, garder la première ligne comme description)
  const lines = message.trim().split('\n');
  const firstLine = lines[0] || '';
  const body = lines.slice(1).join('\n').trim() || null;

  // Pattern conventional commits: type(scope): description
  const conventionalPattern =
    /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(?:\(([^)]+)\))?:\s*(.+)$/i;

  const match = firstLine.match(conventionalPattern);

  if (match) {
    const [, rawType, scope, description] = match;
    const type = mapCommitTypeToUpdateType(rawType.toLowerCase());

    return {
      type,
      scope: scope || null,
      description: capitalizeFirst(description.trim()),
      body
    };
  }

  // Si pas de format conventional, on essaie de détecter le type depuis le début
  const lowerMessage = firstLine.toLowerCase();
  let detectedType: CommitType | null = null;

  // Détection intelligente en français et anglais
  if (
    lowerMessage.includes('fix') ||
    lowerMessage.includes('bug') ||
    lowerMessage.includes('corrige') ||
    lowerMessage.includes('correction') ||
    lowerMessage.includes('erreur')
  ) {
    detectedType = 'fix';
  } else if (
    lowerMessage.includes('feat') ||
    lowerMessage.includes('feature') ||
    lowerMessage.includes('ajout') ||
    lowerMessage.includes('nouveau') ||
    lowerMessage.includes('ajoute') ||
    lowerMessage.includes('nouvelle') ||
    lowerMessage.includes('add')
  ) {
    detectedType = 'feature';
  } else if (
    lowerMessage.includes('improve') ||
    lowerMessage.includes('améliore') ||
    lowerMessage.includes('update') ||
    lowerMessage.includes('mise à jour') ||
    lowerMessage.includes('refactor') ||
    lowerMessage.includes('optimise') ||
    lowerMessage.includes('perf')
  ) {
    detectedType = 'improvement';
  }

  // Enlever les préfixes courants (français et anglais)
  let cleanDescription = firstLine
    .replace(
      /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert|feature|ajout|corrige|améliore)[:()\s]+/i,
      ''
    )
    .trim();

  return {
    type: detectedType,
    scope: null,
    description: capitalizeFirst(cleanDescription || firstLine),
    body
  };
}

/**
 * Mappe le type de commit conventional vers le type de mise à jour
 */
function mapCommitTypeToUpdateType(commitType: string): CommitType | null {
  switch (commitType) {
    case 'feat':
      return 'feature';
    case 'fix':
      return 'fix';
    case 'refactor':
    case 'perf':
    case 'style':
      return 'improvement';
    case 'docs':
      // Les docs peuvent être des annonces si c'est important
      return null; // On filtre les docs par défaut
    case 'chore':
    case 'build':
    case 'ci':
    case 'test':
      return null; // On filtre ces types
    case 'revert':
      return 'fix';
    default:
      return null;
  }
}

/**
 * Génère une description propre à partir du message de commit
 */
export function generateCleanDescription(
  message: string,
  body: string | null
): string {
  const lines = message.trim().split('\n');
  const firstLine = lines[0] || '';

  // Enlever le préfixe de type conventional commits
  let description = firstLine
    .replace(
      /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(?:\([^)]+\))?:\s*/i,
      ''
    )
    .trim();

  // Si on a un body, on peut l'utiliser pour enrichir la description
  if (body && body.length < 200) {
    // Nettoyer le body (enlever les références GitHub, etc.)
    const cleanBody = body
      .replace(/#\d+/g, '') // Enlever les références d'issues
      .replace(/\(.*\)/g, '') // Enlever les parenthèses
      .replace(/\n+/g, ' ') // Remplacer les retours à la ligne par des espaces
      .trim();

    if (cleanBody && cleanBody !== description && cleanBody.length > 10) {
      description = cleanBody;
    }
  }

  // S'assurer que la description commence par une majuscule
  description = capitalizeFirst(description);

  // Limiter la longueur
  if (description.length > 150) {
    description = description.substring(0, 147) + '...';
  }

  return description || 'Mise à jour de la plateforme';
}

/**
 * Capitalise la première lettre d'une chaîne
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Détermine si un commit doit être affiché comme "nouveau"
 * (commits des 7 derniers jours)
 */
export function isNewCommit(commitDate: string): boolean {
  const commit = new Date(commitDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - commit.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

/**
 * Formate le titre pour qu'il soit plus lisible
 */
export function formatCommitTitle(description: string): string {
  // Enlever les verbes d'action en début si présents (français et anglais)
  let title = description
    .replace(
      /^(ajouter|ajoute|ajout|créer|crée|création|modifier|modifie|mise à jour|corriger|corrige|fixer|fixe|add|added|create|created|update|updated|fix|fixed|improve|improved|refactor|refactored)[: ]+/i,
      ''
    )
    .trim();

  // Enlever les préfixes de type restants
  title = title.replace(/^(feat|fix|refactor|perf|style|improve)[:()\s]+/i, '');

  // Capitaliser la première lettre
  title = capitalizeFirst(title);

  // S'assurer que le titre n'est pas trop long
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }

  return title;
}
