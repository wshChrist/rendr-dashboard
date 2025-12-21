import { NextRequest, NextResponse } from 'next/server';
import {
  parseCommitMessage,
  generateCleanDescription,
  formatCommitTitle,
  isNewCommit,
  type CommitType
} from '@/lib/utils/github-commits';
import { PlatformUpdate } from '@/constants/updates-data';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'wshChrist';
const GITHUB_REPO = process.env.GITHUB_REPO || 'rendr-dashboard';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits`;

interface GitHubCommit {
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

/**
 * Récupère les commits GitHub et les transforme en mises à jour formatées
 */
export async function GET(request: NextRequest) {
  try {
    // Paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const branch = searchParams.get('branch') || 'main';

    // Appel à l'API GitHub
    const response = await fetch(
      `${GITHUB_API_URL}?sha=${branch}&per_page=${limit}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          })
        },
        next: { revalidate: 300 } // Cache pendant 5 minutes
      }
    );

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch GitHub commits' },
        { status: response.status }
      );
    }

    const commits: GitHubCommit[] = await response.json();

    // Transformer les commits en mises à jour
    const updates: PlatformUpdate[] = commits
      .map((commit) => {
        const parsed = parseCommitMessage(commit.commit.message);

        // Filtrer les commits qui ne doivent pas être affichés
        if (!parsed.type) {
          return null;
        }

        // Ignorer les merges et commits de configuration (mais garder ceux avec un type défini)
        const message = commit.commit.message.toLowerCase();
        if (
          (message.includes('merge') &&
            !message.includes('feat') &&
            !message.includes('fix')) ||
          (message.startsWith('ci:') && !parsed.type) ||
          (message.startsWith('build:') && !parsed.type) ||
          (message.startsWith('test:') && !parsed.type) ||
          (message.startsWith('chore:') && !parsed.type)
        ) {
          return null;
        }

        const description = generateCleanDescription(
          commit.commit.message,
          null
        );
        const title = formatCommitTitle(description);
        const commitDate = commit.commit.author.date;
        const isNew = isNewCommit(commitDate);

        return {
          id: commit.sha.substring(0, 7),
          type: parsed.type,
          title,
          description,
          date: commitDate.split('T')[0], // Format YYYY-MM-DD
          isNew,
          link: commit.html_url
        } as PlatformUpdate;
      })
      .filter((update): update is PlatformUpdate => update !== null)
      .slice(0, 20); // Limiter à 20 mises à jour

    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
