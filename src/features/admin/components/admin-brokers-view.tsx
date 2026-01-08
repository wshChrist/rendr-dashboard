'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RendRBadge } from '@/components/ui/rendr-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  IconSettings,
  IconPlus,
  IconInfoCircle,
  IconCurrencyDollar,
  IconList,
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconChevronLeft
} from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { BrokerCategory, PayoutPerLotByCategory } from '@/types/cashback';
import { Progress } from '@/components/ui/progress';
import useMultistepForm from '@/hooks/use-multistep-form';
import { FileUploader } from '@/components/file-uploader';

type Broker = {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
};

type BrokerSettings = {
  broker_name: string;
  is_available: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
};

type Row = { broker: Broker; settings: BrokerSettings };

async function fetchBrokers(): Promise<Row[]> {
  const res = await fetch('/api/admin/brokers');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json as Row[];
}

async function patchBrokerSettings(
  input: Partial<BrokerSettings> & { broker_name: string }
) {
  const res = await fetch('/api/admin/brokers', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json as BrokerSettings;
}

async function createBroker(input: {
  name: string;
  logo_url: string;
  category: BrokerCategory;
  cashback_rate: number;
  min_withdrawal: number;
  description?: string;
  website_url: string;
  supported_pairs?: string[];
  payout_per_lot_by_category?: PayoutPerLotByCategory;
}) {
  const res = await fetch('/api/admin/brokers/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la création');
  }
  return json;
}

// Composant Dialog pour gérer un broker
function BrokerManageDialog({
  row,
  isOpen,
  onOpenChange,
  onSave
}: {
  row: Row;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: BrokerSettings) => void;
}) {
  const t = useTranslations();
  const [localSettings, setLocalSettings] = React.useState<BrokerSettings>(
    row.settings
  );
  const [localMessage, setLocalMessage] = React.useState<string>(
    row.settings.maintenance_message ?? ''
  );
  const [isSaving, setIsSaving] = React.useState(false);

  // Mettre à jour les états locaux quand le dialog s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(row.settings);
      setLocalMessage(row.settings.maintenance_message ?? '');
    }
  }, [isOpen, row.settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await patchBrokerSettings({
        broker_name: row.settings.broker_name,
        is_available: localSettings.is_available,
        is_maintenance: localSettings.is_maintenance,
        maintenance_message: localSettings.is_maintenance ? localMessage : null
      });
      onSave(updated);
      toast.success('Paramètres mis à jour');
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Mise à jour impossible', { description: e?.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
              <IconSettings className='h-4 w-4' />
            </div>
            Gérer {row.broker.name}
          </DialogTitle>
          <DialogDescription>
            Configurez la disponibilité et la maintenance de ce broker.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Disponible */}
          <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>Disponible</p>
              <p className='text-muted-foreground text-xs'>
                Affiché comme connectable côté utilisateurs
              </p>
            </div>
            <Switch
              checked={localSettings.is_available}
              disabled={isSaving || localSettings.is_maintenance}
              onCheckedChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, is_available: v }))
              }
            />
          </div>

          {/* Maintenance */}
          <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4'>
            <div className='space-y-0.5'>
              <p className='text-sm font-medium'>Maintenance</p>
              <p className='text-muted-foreground text-xs'>
                Force l'indisponibilité + affiche un message
              </p>
            </div>
            <Switch
              checked={localSettings.is_maintenance}
              disabled={isSaving}
              onCheckedChange={(v) =>
                setLocalSettings((prev) => ({ ...prev, is_maintenance: v }))
              }
            />
          </div>

          {/* Message de maintenance */}
          <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
            <p className='text-sm font-medium'>Message de maintenance</p>
            {localSettings.is_maintenance ? (
              <Textarea
                value={localMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                className='min-h-[100px] border-white/10 bg-white/5 focus:border-white/20'
                placeholder={t('admin.maintenancePlaceholder')}
              />
            ) : (
              <Input
                value={localMessage}
                disabled
                className='border-white/10 bg-white/5'
                placeholder={t('admin.maintenanceActivatePlaceholder')}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('common.processing') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'border-[#c5d13f] bg-[#c5d13f] text-black'
                      : isActive
                        ? 'border-[#c5d13f] bg-[#c5d13f]/20 text-[#c5d13f]'
                        : 'border-white/20 bg-white/5 text-white/40'
                  )}
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
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive
                      ? 'text-white'
                      : isCompleted
                        ? 'text-[#c5d13f]'
                        : 'text-white/40'
                  )}
                >
                  {step.title}
                </p>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 transition-all duration-300',
                    isCompleted ? 'bg-[#c5d13f]' : 'bg-white/20'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <Progress
        value={((currentStep + 1) / steps.length) * 100}
        className='mt-4 h-1.5'
      />
    </div>
  );
}

// Composants d'étapes pour le formulaire
type StepProps = {
  name: string;
  setName: (value: string) => void;
  logoUrl: string;
  setLogoUrl: (value: string) => void;
  logoFiles: File[];
  setLogoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isUploadingLogo: boolean;
  setIsUploadingLogo: (value: boolean) => void;
  category: BrokerCategory;
  setCategory: (value: BrokerCategory) => void;
  description: string;
  setDescription: (value: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  cashbackRate: string;
  setCashbackRate: (value: string) => void;
  minWithdrawal: string;
  setMinWithdrawal: (value: string) => void;
  supportedPairs: string;
  setSupportedPairs: (value: string) => void;
  payoutMajors: string;
  setPayoutMajors: (value: string) => void;
  payoutMinors: string;
  setPayoutMinors: (value: string) => void;
  payoutExotics: string;
  setPayoutExotics: (value: string) => void;
  payoutIndices: string;
  setPayoutIndices: (value: string) => void;
  payoutMetals: string;
  setPayoutMetals: (value: string) => void;
  payoutCrypto: string;
  setPayoutCrypto: (value: string) => void;
};

function Step1BasicInfo(props: StepProps) {
  const handleLogoUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    props.setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/brokers/upload-logo', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'upload");
      }

      props.setLogoUrl(result.url);
      toast.success('Logo uploadé avec succès');
    } catch (error: any) {
      console.error('Erreur upload logo:', error);
      toast.error("Erreur lors de l'upload du logo", {
        description: error.message
      });
      props.setLogoFiles([]);
    } finally {
      props.setIsUploadingLogo(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconInfoCircle className='h-5 w-5 text-[#c5d13f]' />
          Informations de base
        </h3>
        <p className='text-muted-foreground text-sm'>
          Renseignez les informations principales du broker
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='name'>Nom du broker *</Label>
        <Input
          id='name'
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          placeholder='Ex: IC Markets'
          required
          className='border-white/10 bg-white/5'
        />
      </div>
      <div className='space-y-2'>
        <Label>Logo du broker *</Label>
        <FileUploader
          value={props.logoFiles}
          onValueChange={props.setLogoFiles}
          onUpload={handleLogoUpload}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'] }}
          maxSize={5 * 1024 * 1024} // 5MB
          maxFiles={1}
          multiple={false}
          disabled={props.isUploadingLogo || !!props.logoUrl}
          className='border-white/10'
        />
        {props.logoUrl && (
          <div className='mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3'>
            <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-white/10 bg-white/5'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.logoUrl}
                alt='Logo prévisualisé'
                className='h-full w-full object-contain'
              />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium'>Logo uploadé</p>
              <p className='text-muted-foreground truncate text-xs'>
                {props.logoUrl}
              </p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                props.setLogoUrl('');
                props.setLogoFiles([]);
              }}
            >
              Supprimer
            </Button>
          </div>
        )}
        <p className='text-muted-foreground text-xs'>
          Format accepté : PNG, JPG, JPEG, WEBP, SVG (max 5MB)
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='category'>Catégorie *</Label>
        <Select
          value={props.category}
          onValueChange={(v) => props.setCategory(v as BrokerCategory)}
        >
          <SelectTrigger id='category' className='border-white/10 bg-white/5'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='forex'>Forex</SelectItem>
            <SelectItem value='crypto'>Crypto</SelectItem>
            <SelectItem value='futures'>Futures</SelectItem>
            <SelectItem value='multi'>Multi-marchés</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='website_url'>URL du site web *</Label>
        <Input
          id='website_url'
          type='url'
          value={props.websiteUrl}
          onChange={(e) => props.setWebsiteUrl(e.target.value)}
          placeholder='https://example.com'
          required
          className='border-white/10 bg-white/5'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          placeholder='Description du broker...'
          className='min-h-[100px] border-white/10 bg-white/5'
        />
      </div>
    </div>
  );
}

function Step2Financial(props: StepProps) {
  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconCurrencyDollar className='h-5 w-5 text-[#c5d13f]' />
          Paramètres financiers
        </h3>
        <p className='text-muted-foreground text-sm'>
          Configurez les taux et montants financiers
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='cashback_rate'>Taux de cashback * (0.20 = 20%)</Label>
        <Input
          id='cashback_rate'
          type='number'
          step='0.01'
          min='0'
          max='1'
          value={props.cashbackRate}
          onChange={(e) => props.setCashbackRate(e.target.value)}
          placeholder='0.20'
          required
          className='border-white/10 bg-white/5'
        />
        <p className='text-muted-foreground text-xs'>
          Pourcentage du spread reversé aux utilisateurs
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='min_withdrawal'>Retrait minimum * (€)</Label>
        <Input
          id='min_withdrawal'
          type='number'
          step='0.01'
          min='0'
          value={props.minWithdrawal}
          onChange={(e) => props.setMinWithdrawal(e.target.value)}
          placeholder='50'
          required
          className='border-white/10 bg-white/5'
        />
        <p className='text-muted-foreground text-xs'>
          Montant minimum requis pour effectuer un retrait
        </p>
      </div>
    </div>
  );
}

function Step3SupportedPairs(props: StepProps) {
  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconList className='h-5 w-5 text-[#c5d13f]' />
          Paires supportées
        </h3>
        <p className='text-muted-foreground text-sm'>
          Listez les paires de trading supportées par ce broker
        </p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='supported_pairs'>
          Paires supportées (séparées par des virgules)
        </Label>
        <Input
          id='supported_pairs'
          value={props.supportedPairs}
          onChange={(e) => props.setSupportedPairs(e.target.value)}
          placeholder='EUR/USD, GBP/USD, USD/JPY, XAU/USD, US30'
          className='border-white/10 bg-white/5'
        />
        <p className='text-muted-foreground text-xs'>
          Séparez les paires par des virgules (ex: EUR/USD, GBP/USD, XAU/USD)
        </p>
      </div>
    </div>
  );
}

function Step4Payouts(props: StepProps) {
  return (
    <div className='space-y-4'>
      <div className='mb-4 space-y-1'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <IconChartBar className='h-5 w-5 text-[#c5d13f]' />
          Paiements par lot
        </h3>
        <p className='text-muted-foreground text-sm'>
          Définissez les montants payés par lot pour chaque catégorie de paires
        </p>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_majors'>Paires majeures *</Label>
          <Input
            id='payout_majors'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutMajors}
            onChange={(e) => props.setPayoutMajors(e.target.value)}
            placeholder='Ex: 5.00'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            EUR/USD, GBP/USD, USD/JPY, etc.
          </p>
        </div>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_minors'>Paires mineures *</Label>
          <Input
            id='payout_minors'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutMinors}
            onChange={(e) => props.setPayoutMinors(e.target.value)}
            placeholder='Ex: 4.00'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            EUR/GBP, EUR/JPY, GBP/JPY, etc.
          </p>
        </div>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_exotics'>Paires exotiques *</Label>
          <Input
            id='payout_exotics'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutExotics}
            onChange={(e) => props.setPayoutExotics(e.target.value)}
            placeholder='Ex: 3.00'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            USD/ZAR, USD/TRY, EUR/PLN, etc.
          </p>
        </div>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_indices'>Indices *</Label>
          <Input
            id='payout_indices'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutIndices}
            onChange={(e) => props.setPayoutIndices(e.target.value)}
            placeholder='Ex: 6.00'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            US30, NAS100, SPX500, etc.
          </p>
        </div>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_metals'>Métaux *</Label>
          <Input
            id='payout_metals'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutMetals}
            onChange={(e) => props.setPayoutMetals(e.target.value)}
            placeholder='Ex: 5.50'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            XAU/USD, XAG/USD, etc.
          </p>
        </div>
        <div className='space-y-2 rounded-lg border border-white/10 bg-white/5 p-4'>
          <Label htmlFor='payout_crypto'>Cryptomonnaies *</Label>
          <Input
            id='payout_crypto'
            type='number'
            step='0.01'
            min='0'
            value={props.payoutCrypto}
            onChange={(e) => props.setPayoutCrypto(e.target.value)}
            placeholder='Ex: 4.50'
            required
            className='border-white/10 bg-white/5'
          />
          <p className='text-muted-foreground text-xs'>
            BTC/USD, ETH/USD, etc.
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant Dialog pour créer un nouveau broker avec formulaire multi-étapes
function CreateBrokerDialog({
  isOpen,
  onOpenChange,
  onSuccess
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  const [name, setName] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [category, setCategory] = React.useState<BrokerCategory>('forex');
  const [cashbackRate, setCashbackRate] = React.useState('0.20');
  const [minWithdrawal, setMinWithdrawal] = React.useState('50');
  const [description, setDescription] = React.useState('');
  const [websiteUrl, setWebsiteUrl] = React.useState('');
  const [supportedPairs, setSupportedPairs] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [logoFiles, setLogoFiles] = React.useState<File[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);

  // États pour les paiements par lot par catégorie
  const [payoutMajors, setPayoutMajors] = React.useState('');
  const [payoutMinors, setPayoutMinors] = React.useState('');
  const [payoutExotics, setPayoutExotics] = React.useState('');
  const [payoutIndices, setPayoutIndices] = React.useState('');
  const [payoutMetals, setPayoutMetals] = React.useState('');
  const [payoutCrypto, setPayoutCrypto] = React.useState('');

  const stepProps: StepProps = {
    name,
    setName,
    logoUrl,
    setLogoUrl,
    logoFiles,
    setLogoFiles,
    isUploadingLogo,
    setIsUploadingLogo,
    category,
    setCategory,
    description,
    setDescription,
    websiteUrl,
    setWebsiteUrl,
    cashbackRate,
    setCashbackRate,
    minWithdrawal,
    setMinWithdrawal,
    supportedPairs,
    setSupportedPairs,
    payoutMajors,
    setPayoutMajors,
    payoutMinors,
    setPayoutMinors,
    payoutExotics,
    setPayoutExotics,
    payoutIndices,
    setPayoutIndices,
    payoutMetals,
    setPayoutMetals,
    payoutCrypto,
    setPayoutCrypto
  };

  // Définir les étapes
  const stepComponents = React.useMemo(
    () => [
      <Step1BasicInfo key={1} {...stepProps} />,
      <Step2Financial key={2} {...stepProps} />,
      <Step3SupportedPairs key={3} {...stepProps} />,
      <Step4Payouts key={4} {...stepProps} />
    ],
    [stepProps]
  );

  const { currentStepIndex, step, isFirstStep, isLastStep, next, back, goTo } =
    useMultistepForm(stepComponents);

  const steps = [
    {
      title: 'Informations',
      icon: React.createElement(IconInfoCircle, { className: 'h-5 w-5' })
    },
    {
      title: 'Financier',
      icon: React.createElement(IconCurrencyDollar, { className: 'h-5 w-5' })
    },
    {
      title: 'Paires',
      icon: React.createElement(IconList, { className: 'h-5 w-5' })
    },
    {
      title: 'Paiements',
      icon: React.createElement(IconChartBar, { className: 'h-5 w-5' })
    }
  ];

  // Réinitialiser le formulaire quand le dialog s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setLogoUrl('');
      setLogoFiles([]);
      setIsUploadingLogo(false);
      setCategory('forex');
      setCashbackRate('0.20');
      setMinWithdrawal('50');
      setDescription('');
      setWebsiteUrl('');
      setSupportedPairs('');
      setPayoutMajors('');
      setPayoutMinors('');
      setPayoutExotics('');
      setPayoutIndices('');
      setPayoutMetals('');
      setPayoutCrypto('');
      goTo(0);
    }
  }, [isOpen, goTo]);

  const validateCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return name.trim() && logoUrl.trim() && websiteUrl.trim();
      case 1:
        return cashbackRate && minWithdrawal;
      case 2:
        return true; // Paires supportées sont optionnelles
      case 3:
        return (
          payoutMajors &&
          payoutMinors &&
          payoutExotics &&
          payoutIndices &&
          payoutMetals &&
          payoutCrypto
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      next();
    } else {
      toast.error('Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsCreating(true);

    try {
      // Construire l'objet payout_per_lot_by_category
      const payoutPerLot: PayoutPerLotByCategory = {};
      if (payoutMajors) payoutPerLot.majors = parseFloat(payoutMajors);
      if (payoutMinors) payoutPerLot.minors = parseFloat(payoutMinors);
      if (payoutExotics) payoutPerLot.exotics = parseFloat(payoutExotics);
      if (payoutIndices) payoutPerLot.indices = parseFloat(payoutIndices);
      if (payoutMetals) payoutPerLot.metals = parseFloat(payoutMetals);
      if (payoutCrypto) payoutPerLot.crypto = parseFloat(payoutCrypto);

      await createBroker({
        name: name.trim(),
        logo_url: logoUrl.trim(),
        category,
        cashback_rate: parseFloat(cashbackRate),
        min_withdrawal: parseFloat(minWithdrawal),
        description: description.trim() || undefined,
        website_url: websiteUrl.trim(),
        supported_pairs: supportedPairs
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0),
        payout_per_lot_by_category:
          Object.keys(payoutPerLot).length > 0 ? payoutPerLot : undefined
      });
      toast.success('Broker créé avec succès');
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error('Impossible de créer le broker', { description: e?.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
              <IconPlus className='h-4 w-4' />
            </div>
            Créer un nouveau broker
          </DialogTitle>
          <DialogDescription>
            Suivez les étapes pour ajouter un nouveau broker partenaire
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <Stepper steps={steps} currentStep={currentStepIndex} />
          <div className='min-h-[400px]'>{step}</div>
        </div>

        <DialogFooter className='flex items-center justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {t('common.cancel')}
          </Button>
          <div className='flex gap-2'>
            {!isFirstStep && (
              <Button
                type='button'
                variant='outline'
                onClick={back}
                disabled={isCreating}
              >
                <IconChevronLeft className='mr-2 h-4 w-4' />
                Précédent
              </Button>
            )}
            {isLastStep ? (
              <Button
                type='button'
                onClick={handleSubmit}
                disabled={isCreating}
                className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
              >
                {isCreating ? (
                  t('common.processing')
                ) : (
                  <>
                    <IconCheck className='mr-2 h-4 w-4' />
                    Créer le broker
                  </>
                )}
              </Button>
            ) : (
              <Button
                type='button'
                onClick={handleNext}
                disabled={isCreating}
                className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
              >
                Suivant
                <IconChevronRight className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminBrokersView() {
  const t = useTranslations();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedBroker, setSelectedBroker] = React.useState<Row | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [draftMessages, setDraftMessages] = React.useState<
    Record<string, string>
  >({});

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBrokers();
      setRows(data);
      setDraftMessages((prev) => {
        const next = { ...prev };
        for (const r of data) {
          next[r.settings.broker_name] = r.settings.maintenance_message ?? '';
        }
        return next;
      });
    } catch (e: any) {
      toast.error('Impossible de charger les brokers', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateRowSettings = React.useCallback(
    (brokerName: string, next: BrokerSettings) => {
      setRows((prev) =>
        prev.map((r) =>
          r.settings.broker_name === brokerName ? { ...r, settings: next } : r
        )
      );
      // Mettre à jour aussi le draft message
      setDraftMessages((prev) => ({
        ...prev,
        [brokerName]: next.maintenance_message ?? ''
      }));
    },
    []
  );

  const handleManageClick = (row: Row) => {
    setSelectedBroker(row);
    setIsDialogOpen(true);
  };

  const handleSaveSettings = (updated: BrokerSettings) => {
    if (selectedBroker) {
      updateRowSettings(selectedBroker.settings.broker_name, updated);
    }
  };

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-white/5 bg-zinc-900/40 p-6'>
        <p className='text-muted-foreground text-sm'>Chargement…</p>
      </div>
    );
  }

  return (
    <div className='w-full max-w-full space-y-4 overflow-x-hidden'>
      {/* Header responsive */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground max-w-2xl text-sm'>
          Gérez la disponibilité et la maintenance des brokers visibles côté
          utilisateurs.
        </p>
        <div className='flex flex-shrink-0 items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='border-white/10 bg-white/5 hover:bg-white/10'
            onClick={() => load()}
          >
            Rafraîchir
          </Button>
          <Button
            size='sm'
            className='bg-[#c5d13f] text-black hover:bg-[#b8c438]'
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <IconPlus className='mr-2 h-4 w-4' />
            Ajouter un broker
          </Button>
        </div>
      </div>

      {/* Grille responsive : 2 colonnes sur mobile, 2 sur tablette, 3 sur desktop */}
      <div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {rows.map((row) => {
          const s = row.settings;
          const logo = row.broker.logo_url;

          return (
            <div
              key={row.broker.id}
              className={cn(
                'rounded-xl p-3 sm:p-4',
                'bg-zinc-900/40 backdrop-blur-sm',
                'border border-white/5',
                'transition-all duration-300',
                'hover:border-white/10 hover:bg-zinc-900/50',
                'flex flex-col gap-3'
              )}
            >
              {/* Header du broker */}
              <div className='flex flex-col items-center gap-2 text-center'>
                <div className='relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5'>
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt={row.broker.name}
                      className='[box-sizing:content-box] h-full w-full object-contain'
                    />
                  ) : (
                    <span className='text-sm font-bold'>
                      {row.broker.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className='w-full space-y-1.5'>
                  <div className='flex flex-col items-center gap-1.5'>
                    <h3 className='text-sm font-semibold'>{row.broker.name}</h3>
                    {s.is_maintenance ? (
                      <RendRBadge
                        variant='warning'
                        dot
                        dotColor='red'
                        size='sm'
                      >
                        Maintenance
                      </RendRBadge>
                    ) : s.is_available ? (
                      <RendRBadge
                        variant='success'
                        dot
                        dotColor='green'
                        size='sm'
                      >
                        Disponible
                      </RendRBadge>
                    ) : (
                      <RendRBadge variant='muted' size='sm'>
                        Désactivé
                      </RendRBadge>
                    )}
                  </div>
                  {row.broker.description ? (
                    <p className='text-muted-foreground line-clamp-2 text-xs'>
                      {row.broker.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Bouton Gérer */}
              <Button
                variant='outline'
                className='w-full border-white/10 bg-white/5 hover:bg-white/10'
                onClick={() => handleManageClick(row)}
              >
                <IconSettings className='mr-2 h-4 w-4' />
                Gérer
              </Button>
            </div>
          );
        })}
      </div>

      {/* Dialog de gestion */}
      {selectedBroker && (
        <BrokerManageDialog
          row={selectedBroker}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveSettings}
        />
      )}

      {/* Dialog de création */}
      <CreateBrokerDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={load}
      />
    </div>
  );
}
