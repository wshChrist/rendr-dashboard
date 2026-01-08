'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { backendClient } from '@/lib/api/backend-client';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Broker } from '@/types/cashback';
import { RendRBadge } from '@/components/ui/rendr-badge';
import useMultistepForm from '@/hooks/use-multistep-form';
import * as React from 'react';
import {
  IconInfoCircle,
  IconServer,
  IconLock,
  IconCheck,
  IconChevronRight,
  IconChevronLeft
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type BrokerSettings = {
  broker_name: string;
  is_available: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
};

interface CreateTradingAccountFormProps {
  onSuccess?: () => void;
}

// Composant Stepper pour afficher les étapes
function Stepper({
  steps,
  currentStep
}: {
  steps: { title: string; icon: React.ReactNode }[];
  currentStep: number;
}) {
  return (
    <div className='mb-6'>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={index}>
              <div className='flex flex-col items-center'>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'border-[#c5d13f] bg-[#c5d13f] text-black'
                      : isActive
                        ? 'border-[#c5d13f] bg-[#c5d13f]/20 text-[#c5d13f]'
                        : 'border-white/20 bg-white/5 text-white/40'
                  }`}
                >
                  {isCompleted ? (
                    <IconCheck className='h-5 w-5' />
                  ) : (
                    <div className='flex items-center justify-center'>
                      {step.icon}
                    </div>
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? 'text-white'
                      : isCompleted
                        ? 'text-[#c5d13f]'
                        : 'text-white/40'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {!isLast && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-all duration-300 ${
                    isCompleted ? 'bg-[#c5d13f]' : 'bg-white/20'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className='mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20'>
        <div
          className='h-full bg-[#c5d13f] transition-all duration-300'
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}

// Types pour les props des étapes
type StepProps = {
  broker: string;
  setBroker: (value: string) => void;
  platform: 'MT4' | 'MT5';
  setPlatform: (value: 'MT4' | 'MT5') => void;
  server: string;
  setServer: (value: string) => void;
  login: string;
  setLogin: (value: string) => void;
  investorPassword: string;
  setInvestorPassword: (value: string) => void;
  brokers: Broker[];
  brokerSettings: Map<string, BrokerSettings>;
  t: ReturnType<typeof useTranslations>;
};

// Étape 1: Sélection du broker et de la plateforme
function Step1BrokerAndPlatform(props: StepProps) {
  const BROKERS = useMemo(() => {
    return props.brokers.map((broker) => {
      const settings = props.brokerSettings.get(broker.name);
      const isAvailable = settings?.is_available ?? false;
      const isMaintenance = settings?.is_maintenance ?? false;

      return {
        value: broker.name,
        label: broker.name,
        disabled: !isAvailable || isMaintenance,
        available: isAvailable && !isMaintenance
      };
    });
  }, [props.brokers, props.brokerSettings]);

  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconInfoCircle className='h-5 w-5 text-[#c5d13f]' />
          {props.t('brokers.form.step1Title')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {props.t('brokers.form.step1Description')}
        </p>
      </div>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='broker'>{props.t('brokers.form.broker')} *</Label>
          <Select value={props.broker} onValueChange={props.setBroker}>
            <SelectTrigger id='broker' className='border-white/10 bg-white/5'>
              <SelectValue placeholder={props.t('common.actions.search')} />
            </SelectTrigger>
            <SelectContent>
              {BROKERS.map((b) => (
                <SelectItem key={b.value} value={b.value} disabled={b.disabled}>
                  {b.label}
                  {!b.available && (
                    <RendRBadge variant='muted' size='sm' className='ml-2'>
                      {props.t('brokers.form.unavailable')}
                    </RendRBadge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='platform'>{props.t('brokers.form.platform')} *</Label>
          <Select
            value={props.platform}
            onValueChange={(v) => props.setPlatform(v as 'MT4' | 'MT5')}
          >
            <SelectTrigger id='platform' className='border-white/10 bg-white/5'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='MT4'>MetaTrader 4</SelectItem>
              <SelectItem value='MT5'>MetaTrader 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Étape 2: Informations du serveur
function Step2Server(props: StepProps) {
  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconServer className='h-5 w-5 text-[#c5d13f]' />
          {props.t('brokers.form.step2Title')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {props.t('brokers.form.step2Description')}
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='server'>{props.t('brokers.form.serverName')} *</Label>
        <Input
          id='server'
          value={props.server}
          onChange={(e) => props.setServer(e.target.value)}
          placeholder={props.t('brokers.form.serverPlaceholder')}
          required
          className='border-white/10 bg-white/5'
        />
        <p className='text-muted-foreground text-xs'>
          {props.t('brokers.form.serverDescription')}
        </p>
      </div>
    </div>
  );
}

// Étape 3: Informations de connexion
function Step3Credentials(props: StepProps) {
  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconLock className='h-5 w-5 text-[#c5d13f]' />
          {props.t('brokers.form.step3Title')}
        </h3>
        <p className='text-muted-foreground text-sm'>
          {props.t('brokers.form.step3Description')}
        </p>
      </div>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='login'>
            {props.t('brokers.form.accountNumber')} *
          </Label>
          <Input
            id='login'
            type='text'
            inputMode='numeric'
            value={props.login}
            onChange={(e) => props.setLogin(e.target.value)}
            placeholder={props.t('brokers.form.accountNumberPlaceholder')}
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            {props.t('brokers.form.accountIdDescription')}
          </p>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='investor_password'>
            {props.t('brokers.form.investorPassword')} *
          </Label>
          <Input
            id='investor_password'
            type='password'
            value={props.investorPassword}
            onChange={(e) => props.setInvestorPassword(e.target.value)}
            placeholder={props.t('brokers.form.investorPasswordPlaceholder')}
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            {props.t('brokers.form.investorPasswordDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateTradingAccountForm({
  onSuccess
}: CreateTradingAccountFormProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokerSettings, setBrokerSettings] = useState<
    Map<string, BrokerSettings>
  >(new Map());
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  // États pour le formulaire multi-étapes
  const [broker, setBroker] = useState('');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT4');
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');

  // Charger les brokers depuis l'API
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        setIsLoadingBrokers(true);
        const res = await fetch('/api/brokers');
        if (!res.ok) {
          throw new Error('Erreur lors du chargement des brokers');
        }
        const data = await res.json();
        setBrokers(data as Broker[]);
      } catch (error) {
        console.error('Error loading brokers:', error);
        setBrokers([]);
      } finally {
        setIsLoadingBrokers(false);
      }
    };

    loadBrokers();
  }, []);

  // Charger les settings des brokers
  useEffect(() => {
    if (brokers.length === 0) return;

    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('broker_settings')
          .select(
            'broker_name, is_available, is_maintenance, maintenance_message'
          );

        if (!error && data) {
          const settingsMap = new Map<string, BrokerSettings>();
          data.forEach((row) => {
            settingsMap.set(row.broker_name, {
              broker_name: row.broker_name,
              is_available: row.is_available ?? false,
              is_maintenance: row.is_maintenance ?? false,
              maintenance_message: row.maintenance_message ?? null
            });
          });
          setBrokerSettings(settingsMap);
        }
      } catch (error) {
        console.error('Error loading broker settings:', error);
      }
    };

    loadSettings();
  }, [brokers, supabase]);

  // Props pour les étapes
  const stepProps: StepProps = {
    broker,
    setBroker,
    platform,
    setPlatform,
    server,
    setServer,
    login,
    setLogin,
    investorPassword,
    setInvestorPassword,
    brokers,
    brokerSettings,
    t
  };

  // Définir les étapes
  const stepComponents = React.useMemo(
    () => [
      <Step1BrokerAndPlatform key={1} {...stepProps} />,
      <Step2Server key={2} {...stepProps} />,
      <Step3Credentials key={3} {...stepProps} />
    ],
    [stepProps]
  );

  const { currentStepIndex, step, isFirstStep, isLastStep, next, back, goTo } =
    useMultistepForm(stepComponents);

  const steps = [
    {
      title: t('brokers.form.steps.broker'),
      icon: React.createElement(IconInfoCircle, { className: 'h-5 w-5' })
    },
    {
      title: t('brokers.form.steps.server'),
      icon: React.createElement(IconServer, { className: 'h-5 w-5' })
    },
    {
      title: t('brokers.form.steps.credentials'),
      icon: React.createElement(IconLock, { className: 'h-5 w-5' })
    }
  ];

  // Validation de l'étape courante
  const validateCurrentStep = useCallback(() => {
    switch (currentStepIndex) {
      case 0:
        return broker.trim() !== '';
      case 1:
        return server.trim() !== '';
      case 2:
        return login.trim() !== '' && investorPassword.trim() !== '';
      default:
        return true;
    }
  }, [currentStepIndex, broker, server, login, investorPassword]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      next();
    } else {
      toast.error(t('brokers.form.fillRequiredFields'));
    }
  }, [validateCurrentStep, next, t]);

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error(t('brokers.form.fillRequiredFields'));
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer le token Supabase
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Erreur de session Supabase:', sessionError);
        toast.error(t('brokers.form.sessionErrorTitle'), {
          description:
            sessionError.message || t('brokers.form.sessionErrorDescription')
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

      // Créer le compte via le backend
      const account = await backendClient.createTradingAccount(
        {
          broker: broker,
          platform: platform,
          server: server,
          login: login,
          investor_password: investorPassword
        },
        session.access_token
      );

      toast.success(t('brokers.form.accountCreatedSuccess'), {
        description: t('brokers.form.accountCreatedDescription', {
          accountId: account.external_account_id
        })
      });

      // Réinitialiser le formulaire
      setBroker('');
      setPlatform('MT4');
      setServer('');
      setLogin('');
      setInvestorPassword('');
      goTo(0);
      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error('Erreur lors de la création du compte:', error);
      const errorMessage = error.message || t('common.error');
      toast.error(t('brokers.form.createError'), {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingBrokers) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Stepper steps={steps} currentStep={currentStepIndex} />
      <div className='min-h-[300px]'>{step}</div>
      <div className='flex items-center justify-between border-t border-white/10 pt-4'>
        <Button
          type='button'
          variant='outline'
          onClick={() => {
            setBroker('');
            setPlatform('MT4');
            setServer('');
            setLogin('');
            setInvestorPassword('');
            goTo(0);
          }}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <div className='flex gap-2'>
          {!isFirstStep && (
            <Button
              type='button'
              variant='outline'
              onClick={back}
              disabled={isLoading}
            >
              <IconChevronLeft className='mr-2 h-4 w-4' />
              {t('common.actions.previous')}
            </Button>
          )}
          {isLastStep ? (
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={isLoading}
              className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
            >
              {isLoading ? (
                t('common.processing')
              ) : (
                <>
                  <IconCheck className='mr-2 h-4 w-4' />
                  {t('brokers.form.createAccount')}
                </>
              )}
            </Button>
          ) : (
            <Button
              type='button'
              onClick={handleNext}
              disabled={isLoading}
              className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
            >
              {t('common.actions.next')}
              <IconChevronRight className='ml-2 h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
