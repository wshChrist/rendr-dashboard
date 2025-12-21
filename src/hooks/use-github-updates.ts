'use client';

import { useEffect, useState } from 'react';
import { PlatformUpdate } from '@/constants/updates-data';

interface UseGitHubUpdatesReturn {
  updates: PlatformUpdate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook pour récupérer les mises à jour depuis GitHub
 */
export function useGitHubUpdates(): UseGitHubUpdatesReturn {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/updates/github?limit=30');

      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }

      const data = await response.json();
      setUpdates(data);
    } catch (err) {
      console.error('Error fetching GitHub updates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // En cas d'erreur, on retourne un tableau vide plutôt que de planter
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  return {
    updates,
    isLoading,
    error,
    refetch: fetchUpdates
  };
}
