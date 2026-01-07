'use client';

import { useState } from 'react';
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { userBrokersData } from '@/constants/cashback-data';
import type { Broker } from '@/types/cashback';
import { Button } from '@/components/ui/button';
import {
  IconExternalLink,
  IconCheck,
  IconPercentage,
  IconCurrencyEuro,
  IconInfoCircle,
  IconKey,
  IconServer,
  IconUser,
  IconLock,
  IconFilter
} from '@tabler/icons-react';
import { BrokerCategory } from '@/types/cashback';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { backendClient } from '@/lib/api/backend-client';
import { createSupabaseClient } from '@/lib/supabase/client';

interface ConnectBrokerDialogProps {
  broker: Broker;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ConnectBrokerDialog({
  broker,
  isOpen,
  onOpenChange
}: ConnectBrokerDialogProps) {
  const t = useTranslations();
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT4');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId || !password || !server) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer le token Supabase
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Créer le compte via le backend
      const account = await backendClient.createTradingAccount(
        {
          broker: broker.name,
          platform: platform,
          server: server,
          login: accountId,
          investor_password: password
        },
        session.access_token
      );

      setIsLoading(false);
      onOpenChange(false);

      toast.success(`Compte ${broker.name} connecté avec succès !`, {
        description: `Votre compte ${accountId} a été lié et sera configuré automatiquement sur le VPS.`,
        duration: 5000
      });

      // Réinitialiser le formulaire
      setAccountId('');
      setPassword('');
      setServer('');

      // Recharger la page pour afficher le nouveau compte
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
      toast.error(t('brokers.errors.connectionError'), {
        description: error.message || 'Une erreur est survenue'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconKey className='h-5 w-5' />
            </div>
            {t('brokers.form.connectBroker')} {broker.name}
          </DialogTitle>
          <DialogDescription>
            {t('brokers.form.connectDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            {/* Account ID */}
            <div className='space-y-2'>
              <Label htmlFor='account-id' className='flex items-center gap-2'>
                <IconUser className='h-4 w-4' />
                {t('brokers.form.accountNumber')} *
              </Label>
              <Input
                id='account-id'
                type='text'
                placeholder={t('brokers.form.accountNumberPlaceholder')}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className='border-white/10 bg-white/5'
                required
              />
              <p className='text-muted-foreground text-xs'>
                {t('brokers.form.accountIdDescription')} {broker.name}
              </p>
            </div>

            {/* Password */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='flex items-center gap-2'>
                <IconLock className='h-4 w-4' />
                {t('brokers.form.password')} *
              </Label>
              <Input
                id='password'
                type='password'
                placeholder={t('brokers.form.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='border-white/10 bg-white/5'
                required
              />
              <p className='text-muted-foreground text-xs'>
                {t('brokers.form.passwordDescription')}
              </p>
            </div>

            {/* Platform */}
            <div className='space-y-2'>
              <Label htmlFor='platform' className='flex items-center gap-2'>
                <IconServer className='h-4 w-4' />
                {t('brokers.form.platform')} *
              </Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as 'MT4' | 'MT5')}
              >
                <SelectTrigger className='border-white/10 bg-white/5'>
                  <SelectValue placeholder={t('brokers.form.selectPlatform')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MT4'>MetaTrader 4</SelectItem>
                  <SelectItem value='MT5'>MetaTrader 5</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-xs'>
                {t('brokers.form.platformDescription')}
              </p>
            </div>

            {/* Server */}
            <div className='space-y-2'>
              <Label htmlFor='server' className='flex items-center gap-2'>
                <IconServer className='h-4 w-4' />
                {t('brokers.form.server')} *
              </Label>
              <Input
                id='server'
                type='text'
                placeholder={t('brokers.form.serverPlaceholder')}
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className='border-white/10 bg-white/5'
                required
              />
              <p className='text-muted-foreground text-xs'>
                {t('brokers.form.serverDescription')}
              </p>
            </div>

            {/* Info box */}
            <div className='rounded-xl border border-white/5 bg-white/5 p-3'>
              <div className='flex items-start gap-2'>
                <IconInfoCircle className='text-muted-foreground mt-0.5 h-4 w-4' />
                <div className='text-muted-foreground space-y-1 text-xs'>
                  <p className='text-foreground font-medium'>
                    {t('brokers.form.security')}
                  </p>
                  <p>{t('brokers.form.securityDescription')}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading
                ? t('brokers.form.connecting')
                : t('brokers.form.connectAccount')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const categoryLabels: Record<BrokerCategory, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  futures: 'Futures',
  multi: 'Multi-marchés'
};

// Type pour les settings de broker
interface BrokerSettings {
  broker_name: string;
  is_available: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
}

// Composant pour une carte de broker compacte
function BrokerCard({
  broker,
  settings,
  onConnect
}: {
  broker: Broker;
  settings?: BrokerSettings;
  onConnect: (broker: Broker) => void;
}) {
  const t = useTranslations();
  const [imageError, setImageError] = useState(false);

  // Déterminer le statut du broker
  // Si pas de settings, considérer comme non disponible par défaut
  const isAvailable = settings ? settings.is_available : false;
  const isMaintenance = settings?.is_maintenance ?? false;
  const isComingSoon = !isAvailable && !isMaintenance;

  // Minimum deposit (utiliser min_withdrawal comme proxy)
  const minDeposit = broker.min_withdrawal;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl p-4',
        'bg-zinc-900/40 backdrop-blur-sm',
        'border border-white/5 transition-all duration-300',
        'hover:border-white/10 hover:bg-zinc-900/50',
        'cursor-pointer'
      )}
      onClick={() => {
        if (isAvailable && !isMaintenance) {
          onConnect(broker);
        }
      }}
    >
      {/* Logo centré */}
      <div className='mb-3 flex items-center justify-center'>
        <div className='relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 transition-transform duration-300 group-hover:scale-105'>
          {!imageError && broker.logo_url ? (
            <img
              src={broker.logo_url}
              alt={broker.name}
              className='h-full w-full object-contain'
              onError={() => setImageError(true)}
            />
          ) : (
            <span className='text-lg font-bold'>
              {broker.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Nom du broker */}
      <h3 className='mb-2 text-center text-sm font-semibold'>{broker.name}</h3>

      {/* Statut */}
      <div className='mb-3 flex justify-center'>
        {isMaintenance ? (
          <RendRBadge variant='warning' dot dotColor='red' size='sm'>
            {t('brokers.status.maintenance')}
          </RendRBadge>
        ) : isComingSoon ? (
          <RendRBadge variant='muted' size='sm'>
            {t('brokers.status.comingSoon')}
          </RendRBadge>
        ) : (
          <RendRBadge variant='success' dot dotColor='green' size='sm'>
            {t('brokers.status.available')}
          </RendRBadge>
        )}
      </div>

      {/* Minimum deposit */}
      <div className='mb-3 flex items-center justify-center gap-1.5'>
        <IconCurrencyEuro className='text-muted-foreground h-3.5 w-3.5' />
        <span className='text-xs'>
          <span className='text-muted-foreground'>
            {t('brokers.minDeposit')}:{' '}
          </span>
          <span className='font-semibold'>{minDeposit}€</span>
        </span>
      </div>

      {/* Cashback rate */}
      <div className='mb-3 flex items-center justify-center gap-1.5'>
        <IconPercentage className='h-3.5 w-3.5 text-[#c5d13f]' />
        <span className='text-xs'>
          <span className='font-bold text-[#c5d13f]'>
            {(broker.cashback_rate * 100).toFixed(0)}%
          </span>
          <span className='text-muted-foreground'> cashback</span>
        </span>
      </div>

      {/* Message de maintenance si applicable */}
      {isMaintenance && settings?.maintenance_message && (
        <p className='text-muted-foreground mb-3 text-center text-xs'>
          {settings.maintenance_message}
        </p>
      )}

      {/* Bouton d'action */}
      <div className='mt-auto'>
        {isAvailable && !isMaintenance ? (
          <Button
            size='sm'
            className='w-full text-xs'
            onClick={(e) => {
              e.stopPropagation();
              onConnect(broker);
            }}
          >
            {t('brokers.form.connectBroker')}
          </Button>
        ) : (
          <Button
            size='sm'
            disabled
            className='w-full cursor-not-allowed text-xs opacity-50'
          >
            {isMaintenance
              ? t('brokers.status.maintenance')
              : t('brokers.status.comingSoon')}
          </Button>
        )}
      </div>
    </div>
  );
}

export function AvailableBrokers() {
  const t = useTranslations();
  const connectedBrokerIds = userBrokersData.map((ub) => ub.broker_id);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    BrokerCategory | 'all'
  >('all');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [brokerSettings, setBrokerSettings] = useState<
    Map<string, BrokerSettings>
  >(new Map());
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(true);

  // Fonction pour charger les brokers depuis l'API
  const loadBrokers = React.useCallback(async () => {
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
  }, []);

  // Fonction pour charger les settings des brokers
  const loadBrokerSettings = React.useCallback(async () => {
    try {
      // Récupérer les settings depuis Supabase directement (lecture publique)
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('broker_settings')
        .select(
          'broker_name, is_available, is_maintenance, maintenance_message'
        );

      if (!error && data) {
        const settingsMap = new Map<string, BrokerSettings>();

        // Créer une map de tous les brokers avec leurs settings
        brokers.forEach((broker) => {
          const dbSetting = data.find((row) => row.broker_name === broker.name);
          if (dbSetting) {
            // Utiliser les settings de la base de données
            settingsMap.set(broker.name, {
              broker_name: broker.name,
              is_available: dbSetting.is_available ?? true,
              is_maintenance: dbSetting.is_maintenance ?? false,
              maintenance_message: dbSetting.maintenance_message ?? null
            });
          } else {
            // Si pas de settings en DB, créer des valeurs par défaut (non disponible)
            settingsMap.set(broker.name, {
              broker_name: broker.name,
              is_available: false, // Par défaut non disponible si pas de settings
              is_maintenance: false,
              maintenance_message: null
            });
          }
        });

        setBrokerSettings(settingsMap);
      } else if (error) {
        console.error('Error loading broker settings:', error);
        // En cas d'erreur, créer des settings par défaut pour tous les brokers
        const defaultSettingsMap = new Map<string, BrokerSettings>();
        brokers.forEach((broker) => {
          defaultSettingsMap.set(broker.name, {
            broker_name: broker.name,
            is_available: false,
            is_maintenance: false,
            maintenance_message: null
          });
        });
        setBrokerSettings(defaultSettingsMap);
      }
    } catch (error) {
      console.error('Error loading broker settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [brokers]);

  // Charger les brokers au montage
  React.useEffect(() => {
    loadBrokers();
  }, [loadBrokers]);

  // Charger les settings quand les brokers sont chargés
  React.useEffect(() => {
    if (brokers.length > 0) {
      loadBrokerSettings();
    }
  }, [brokers, loadBrokerSettings]);

  // Rafraîchir périodiquement
  React.useEffect(() => {
    if (brokers.length === 0) return;

    // Rafraîchir les brokers et settings toutes les 5 secondes
    const interval = setInterval(() => {
      loadBrokers();
      loadBrokerSettings();
    }, 5000);

    return () => clearInterval(interval);
  }, [brokers.length, loadBrokers, loadBrokerSettings]);

  // Écouter les changements de focus de la fenêtre pour rafraîchir quand on revient sur la page
  React.useEffect(() => {
    const handleFocus = () => {
      loadBrokers();
      loadBrokerSettings();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadBrokers, loadBrokerSettings]);

  // Filtrer les brokers déjà connectés
  const availableBrokersFiltered = brokers.filter(
    (broker) => !connectedBrokerIds.includes(broker.id)
  );

  // Filtrer par catégorie
  const availableBrokers =
    selectedCategory === 'all'
      ? availableBrokersFiltered
      : availableBrokersFiltered.filter(
          (broker) => broker.category === selectedCategory
        );

  // Obtenir les catégories disponibles
  const availableCategories = Array.from(
    new Set(availableBrokersFiltered.map((b) => b.category))
  ) as BrokerCategory[];

  const handleConnectClick = (broker: Broker) => {
    setSelectedBroker(broker);
    setIsDialogOpen(true);
  };

  if (isLoadingBrokers || isLoadingSettings) {
    return (
      <div className='flex items-center justify-center p-8'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Info box */}
      <div
        className={cn(
          'rounded-2xl p-5',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='flex items-start gap-3'>
          <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
            <IconInfoCircle className='text-muted-foreground h-5 w-5' />
          </div>
          <div>
            <h3 className='mb-2 font-semibold'>
              {t('brokers.howItWorks.title')}
            </h3>
            <ol className='text-muted-foreground list-inside list-decimal space-y-1 text-sm'>
              <li>{t('brokers.howItWorks.step1')}</li>
              <li>{t('brokers.howItWorks.step2')}</li>
              <li>{t('brokers.howItWorks.step3')}</li>
              <li>{t('brokers.howItWorks.step4')}</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div
        className={cn(
          'rounded-xl p-4',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}
      >
        <div className='mb-3 flex items-center gap-2'>
          <IconFilter className='text-muted-foreground h-4 w-4' />
          <span className='text-sm font-medium'>Catégorie</span>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'text-xs',
              selectedCategory === 'all'
                ? 'border-white/20 bg-white/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            )}
          >
            Tous
          </Button>
          {availableCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'text-xs',
                selectedCategory === category
                  ? 'border-white/20 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              )}
            >
              {categoryLabels[category]}
            </Button>
          ))}
        </div>
      </div>

      {/* Broker cards - Grille en 2 colonnes */}
      {availableBrokers.length > 0 ? (
        <div className='grid grid-cols-2 gap-3 sm:gap-4'>
          {availableBrokers.map((broker, index) => {
            const settings = brokerSettings.get(broker.name);
            return (
              <div
                key={broker.id}
                className='animate-fade-in-up opacity-0'
                style={{
                  animationDelay: `${(index + 1) * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <BrokerCard
                  broker={broker}
                  settings={settings}
                  onConnect={handleConnectClick}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-xl p-8',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'text-center',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationFillMode: 'forwards' }}
        >
          <p className='text-muted-foreground'>
            {t('brokers.noBrokersInCategory')}
          </p>
        </div>
      )}

      {/* Dialog de connexion */}
      {selectedBroker && (
        <ConnectBrokerDialog
          broker={selectedBroker}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
}
