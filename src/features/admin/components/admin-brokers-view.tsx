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
import { IconSettings, IconPlus } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { BrokerCategory } from '@/types/cashback';

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

// Composant Dialog pour créer un nouveau broker
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

  // Réinitialiser le formulaire quand le dialog s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setLogoUrl('');
      setCategory('forex');
      setCashbackRate('0.20');
      setMinWithdrawal('50');
      setDescription('');
      setWebsiteUrl('');
      setSupportedPairs('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
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
          .filter((p) => p.length > 0)
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
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
              <IconPlus className='h-4 w-4' />
            </div>
            Créer un nouveau broker
          </DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau broker partenaire à la plateforme.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          {/* Nom */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Nom du broker *</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: IC Markets'
              required
              className='border-white/10 bg-white/5'
            />
          </div>

          {/* Logo URL */}
          <div className='space-y-2'>
            <Label htmlFor='logo_url'>URL du logo *</Label>
            <Input
              id='logo_url'
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder='Ex: /brokers/icmarkets.png'
              required
              className='border-white/10 bg-white/5'
            />
          </div>

          {/* Catégorie */}
          <div className='space-y-2'>
            <Label htmlFor='category'>Catégorie *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BrokerCategory)}
            >
              <SelectTrigger
                id='category'
                className='border-white/10 bg-white/5'
              >
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

          {/* Cashback rate */}
          <div className='space-y-2'>
            <Label htmlFor='cashback_rate'>
              Taux de cashback * (0.20 = 20%)
            </Label>
            <Input
              id='cashback_rate'
              type='number'
              step='0.01'
              min='0'
              max='1'
              value={cashbackRate}
              onChange={(e) => setCashbackRate(e.target.value)}
              placeholder='0.20'
              required
              className='border-white/10 bg-white/5'
            />
          </div>

          {/* Minimum withdrawal */}
          <div className='space-y-2'>
            <Label htmlFor='min_withdrawal'>Retrait minimum * (€)</Label>
            <Input
              id='min_withdrawal'
              type='number'
              step='0.01'
              min='0'
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(e.target.value)}
              placeholder='50'
              required
              className='border-white/10 bg-white/5'
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Description du broker...'
              className='min-h-[100px] border-white/10 bg-white/5'
            />
          </div>

          {/* Website URL */}
          <div className='space-y-2'>
            <Label htmlFor='website_url'>URL du site web *</Label>
            <Input
              id='website_url'
              type='url'
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder='https://example.com'
              required
              className='border-white/10 bg-white/5'
            />
          </div>

          {/* Supported pairs */}
          <div className='space-y-2'>
            <Label htmlFor='supported_pairs'>
              Paires supportées (séparées par des virgules)
            </Label>
            <Input
              id='supported_pairs'
              value={supportedPairs}
              onChange={(e) => setSupportedPairs(e.target.value)}
              placeholder='EUR/USD, GBP/USD, USD/JPY'
              className='border-white/10 bg-white/5'
            />
            <p className='text-muted-foreground text-xs'>
              Séparez les paires par des virgules (ex: EUR/USD, GBP/USD)
            </p>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={isCreating}>
              {isCreating ? t('common.processing') : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
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
