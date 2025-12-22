'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

/**
 * Hook pour gérer l'enregistrement automatique du code de parrainage lors de l'inscription
 *
 * Ce hook :
 * 1. Détecte le paramètre `ref` dans l'URL
 * 2. Attends que l'utilisateur soit authentifié
 * 3. Appelle l'API pour enregistrer la relation de parrainage
 */
export function useReferralRegistration() {
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref') || null;
  const supabase = createSupabaseClient();
  const hasRegisteredRef = useRef(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Si pas de code de parrainage, on ne fait rien
    if (!referralCode || hasRegisteredRef.current || isChecking) {
      return;
    }

    const registerReferral = async () => {
      try {
        setIsChecking(true);
        // Vérifier si l'utilisateur est authentifié
        const {
          data: { user },
          error: authError
        } = await supabase.auth.getUser();

        if (authError || !user) {
          // Utilisateur pas encore authentifié, on attend
          setIsChecking(false);
          return;
        }

        // Enregistrer le code de parrainage
        const response = await fetch('/api/referral/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            referral_code: referralCode
          })
        });

        if (response.ok) {
          hasRegisteredRef.current = true;
          console.log('Code de parrainage enregistré avec succès');
        } else {
          const data = await response.json();
          // Ne pas afficher d'erreur si c'est déjà parrainé (normal)
          if (
            response.status !== 400 ||
            !data.message?.includes('Déjà parrainé')
          ) {
            console.warn(
              "Erreur lors de l'enregistrement du code de parrainage:",
              data.message
            );
          }
        }
        setIsChecking(false);
      } catch (error) {
        console.error(
          "Erreur lors de l'enregistrement du code de parrainage:",
          error
        );
        setIsChecking(false);
      }
    };

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Quand l'utilisateur se connecte pour la première fois (SIGNED_IN)
      if (event === 'SIGNED_IN' && session?.user && !hasRegisteredRef.current) {
        registerReferral();
      }
    });

    // Vérifier immédiatement si l'utilisateur est déjà connecté
    registerReferral();

    return () => {
      subscription.unsubscribe();
    };
  }, [referralCode, supabase]);
}
