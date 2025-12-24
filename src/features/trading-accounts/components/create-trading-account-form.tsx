'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { useState } from 'react';
import { backendClient } from '@/lib/api/backend-client';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { brokersData } from '@/constants/cashback-data';
import { RendRBadge } from '@/components/ui/rendr-badge';

// Le schéma sera créé dans le composant pour accéder aux traductions
type FormValues = {
  broker: string;
  platform: 'MT4' | 'MT5';
  server: string;
  login: string;
  investor_password: string;
};

// Générer la liste des brokers depuis brokersData avec indication de disponibilité
const BROKERS = brokersData.map((broker) => {
  const isAvailable = broker.name === 'Vantage'; // Seul Vantage est disponible pour l'instant
  return {
    value: broker.name,
    label: broker.name,
    disabled: !isAvailable,
    available: isAvailable
  };
});

const PLATFORMS = [
  { value: 'MT4', label: 'MetaTrader 4' },
  { value: 'MT5', label: 'MetaTrader 5' }
];

interface CreateTradingAccountFormProps {
  onSuccess?: () => void;
}

export function CreateTradingAccountForm({
  onSuccess
}: CreateTradingAccountFormProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  // Créer le schéma de validation avec les traductions
  const formSchema = useMemo(() => z.object({
    broker: z.string().min(1, t('brokers.form.brokerRequired')),
    platform: z.enum(['MT4', 'MT5'], {
      message: t('brokers.form.platformRequired')
    }),
    server: z.string().min(1, t('brokers.form.serverRequired')),
    login: z.string().min(1, t('brokers.form.accountNumberRequired')),
    investor_password: z
      .string()
      .min(1, t('brokers.form.investorPasswordRequired'))
  }), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      broker: '',
      platform: 'MT4',
      server: '',
      login: '',
      investor_password: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      console.log('Début de la création du compte:', values);

      // Récupérer le token Supabase
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Erreur de session Supabase:', sessionError);
        toast.error('Erreur de session', {
          description:
            sessionError.message || 'Impossible de récupérer la session'
        });
        setIsLoading(false);
        return;
      }

      if (!session?.access_token) {
        console.error("Pas de token d'accès");
        toast.error(t('tradingAccount.mustBeConnected'), {
          description: t('tradingAccount.pleaseConnect')
        });
        setIsLoading(false);
        return;
      }

      console.log("Token récupéré, appel de l'API backend...");
      console.log(
        'URL API:',
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      );

      // Créer le compte via le backend
      const account = await backendClient.createTradingAccount(
        {
          broker: values.broker,
          platform: values.platform,
          server: values.server,
          login: values.login,
          investor_password: values.investor_password
        },
        session.access_token
      );

      console.log('Compte créé avec succès:', account);

      toast.success('Compte créé avec succès !', {
        description: `Le compte ${account.external_account_id} sera configuré automatiquement sur le VPS.`
      });

      form.reset();
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error('Erreur lors de la création du compte:', error);
      console.error("Détails de l'erreur:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      const errorMessage = error.message || 'Une erreur est survenue';
      toast.error('Erreur lors de la création du compte', {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('brokers.addTradingAccount')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
        >
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormSelect
              control={form.control}
              name='broker'
              label={t('nav.brokers')}
              placeholder={t('common.search')}
              options={BROKERS}
              required
            />

            <FormSelect
              control={form.control}
              name='platform'
              label={t('brokers.form.platform')}
              placeholder={t('brokers.form.selectPlatform')}
              options={PLATFORMS}
              required
            />
          </div>

          <FormInput
            control={form.control}
            name='server'
            label={t('brokers.form.server')}
            placeholder={t('brokers.form.serverPlaceholder')}
            description={t('brokers.form.serverDescription')}
            required
          />

          <FormInput
            control={form.control}
            name='login'
            label={t('brokers.form.accountNumber')}
            placeholder={t('brokers.form.accountNumberPlaceholder')}
            description={t('brokers.accountIdDescription')}
            required
            type='text'
            inputMode='numeric'
          />

          <FormInput
            control={form.control}
            name='investor_password'
            label={t('brokers.form.investorPassword')}
            placeholder={t('brokers.form.investorPasswordPlaceholder')}
            description={t('brokers.form.investorPasswordDescription')}
            required
            type='password'
          />

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => form.reset()}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer le compte'}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
