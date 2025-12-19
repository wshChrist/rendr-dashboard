'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';

export default function PieStatsError({ error }: { error: Error }) {
  return (
    <Alert variant='destructive'>
      <IconAlertCircle className='h-4 w-4' />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>
        Impossible de charger les statistiques : {error.message}
      </AlertDescription>
    </Alert>
  );
}
