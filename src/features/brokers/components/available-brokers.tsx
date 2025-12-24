'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { brokersData, userBrokersData } from '@/constants/cashback-data';
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
  broker: (typeof brokersData)[0];
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
                  <p className='text-foreground font-medium'>{t('brokers.form.security')}</p>
                  <p>
                    {t('brokers.form.securityDescription')}
                  </p>
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
              {isLoading ? t('brokers.form.connecting') : t('brokers.form.connectAccount')}
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

// Composant pour une carte de broker
function BrokerCard({
  broker,
  onConnect
}: {
  broker: (typeof brokersData)[0];
  onConnect: (broker: (typeof brokersData)[0]) => void;
}) {
  const t = useTranslations();
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl p-4',
        'bg-zinc-900/40 backdrop-blur-sm',
        'border border-white/5 hover:border-white/10',
        'transition-all duration-300',
        'hover:bg-zinc-900/50'
      )}
    >
      <div className='flex items-center gap-4'>
        {/* Logo */}
        <div className='relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5'>
          {!imageError && broker.logo_url ? (
            <img
              src={broker.logo_url}
              alt={broker.name}
              className='[box-sizing:content-box] h-full w-full object-contain'
              onError={() => setImageError(true)}
            />
          ) : (
            <span className='text-sm font-bold'>
              {broker.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info principale */}
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='text-sm font-semibold'>{broker.name}</h3>
            {broker.name !== 'Vantage' && (
              <RendRBadge variant='muted' size='sm'>
                Bientôt disponible
              </RendRBadge>
            )}
          </div>
          <p className='text-muted-foreground mb-2 line-clamp-1 text-xs'>
            {broker.description}
          </p>

          {/* Stats inline */}
          <div className='flex items-center gap-4 text-xs'>
            <div className='flex items-center gap-1'>
              <IconPercentage className='h-3.5 w-3.5 text-[#c5d13f]' />
              <span className='text-foreground font-bold'>
                {(broker.cashback_rate * 100).toFixed(0)}%
              </span>
              <span className='text-muted-foreground'>cashback</span>
            </div>
            <div className='flex items-center gap-1'>
              <IconCurrencyEuro className='text-muted-foreground h-3.5 w-3.5' />
              <span className='font-semibold'>{broker.min_withdrawal}€</span>
              <span className='text-muted-foreground'>min</span>
            </div>
            <div className='flex min-w-0 flex-1 items-center gap-1.5'>
              {broker.supported_pairs.slice(0, 3).map((pair) => (
                <RendRBadge
                  key={pair}
                  variant='outline'
                  size='sm'
                  className='h-4 px-1.5 font-mono text-[10px]'
                >
                  {pair}
                </RendRBadge>
              ))}
              {broker.supported_pairs.length > 3 && (
                <span className='text-muted-foreground text-[10px]'>
                  +{broker.supported_pairs.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex shrink-0 items-center gap-2'>
          {broker.name === 'Vantage' ? (
            <Button
              size='sm'
              onClick={() => onConnect(broker)}
              className='text-xs'
            >
              {t('brokers.form.connectBroker')}
            </Button>
          ) : (
            <Button
              size='sm'
              disabled
              className='cursor-not-allowed text-xs opacity-50'
            >
              Bientôt disponible
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 hover:bg-white/5'
            asChild
          >
            <a
              href={broker.website_url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <IconExternalLink className='h-3.5 w-3.5' />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AvailableBrokers() {
  const t = useTranslations();
  const connectedBrokerIds = userBrokersData.map((ub) => ub.broker_id);
  const [selectedBroker, setSelectedBroker] = useState<
    (typeof brokersData)[0] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    BrokerCategory | 'all'
  >('all');

  // Filtrer les brokers déjà connectés
  const availableBrokersFiltered = brokersData.filter(
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

  const handleConnectClick = (broker: (typeof brokersData)[0]) => {
    setSelectedBroker(broker);
    setIsDialogOpen(true);
  };

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
            <h3 className='mb-2 font-semibold'>{t('brokers.howItWorks.title')}</h3>
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

      {/* Broker cards - Layout compact innovant */}
      {availableBrokers.length > 0 ? (
        <div className='space-y-2'>
          {availableBrokers.map((broker, index) => (
            <div
              key={broker.id}
              className='animate-fade-in-up opacity-0'
              style={{
                animationDelay: `${(index + 1) * 50}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <BrokerCard broker={broker} onConnect={handleConnectClick} />
            </div>
          ))}
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
            Aucun broker disponible dans cette catégorie
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
