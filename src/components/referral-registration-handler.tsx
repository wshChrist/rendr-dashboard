'use client';

import { useReferralRegistration } from '@/hooks/use-referral-registration';

/**
 * Composant qui gère l'enregistrement automatique du code de parrainage
 * À utiliser dans les pages d'inscription
 */
export function ReferralRegistrationHandler() {
  useReferralRegistration();
  return null; // Composant invisible
}
