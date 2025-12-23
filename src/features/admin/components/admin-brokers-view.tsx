'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RendRBadge } from '@/components/ui/rendr-badge';

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

async function patchBrokerSettings(input: Partial<BrokerSettings> & { broker_name: string }) {
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

export function AdminBrokersView() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [draftMessages, setDraftMessages] = React.useState<Record<string, string>>(
    {}
  );

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
      toast.error('Impossible de charger les brokers', { description: e?.message });
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
    },
    []
  );

  const onToggleAvailable = async (brokerName: string, value: boolean) => {
    setSaving(brokerName);
    try {
      const updated = await patchBrokerSettings({
        broker_name: brokerName,
        is_available: value
      });
      updateRowSettings(brokerName, updated);
      toast.success('Disponibilité mise à jour');
    } catch (e: any) {
      toast.error('Mise à jour impossible', { description: e?.message });
    } finally {
      setSaving(null);
    }
  };

  const onToggleMaintenance = async (brokerName: string, value: boolean) => {
    setSaving(brokerName);
    try {
      const updated = await patchBrokerSettings({
        broker_name: brokerName,
        is_maintenance: value
      });
      updateRowSettings(brokerName, updated);
      toast.success('Maintenance mise à jour');
    } catch (e: any) {
      toast.error('Mise à jour impossible', { description: e?.message });
    } finally {
      setSaving(null);
    }
  };

  const onSaveMessage = async (brokerName: string) => {
    setSaving(brokerName);
    try {
      const updated = await patchBrokerSettings({
        broker_name: brokerName,
        maintenance_message: draftMessages[brokerName] ?? ''
      });
      updateRowSettings(brokerName, updated);
      toast.success('Message enregistré');
    } catch (e: any) {
      toast.error('Enregistrement impossible', { description: e?.message });
    } finally {
      setSaving(null);
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
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <p className='text-muted-foreground text-sm'>
          Gérez la disponibilité et la maintenance des brokers visibles côté utilisateurs.
        </p>
        <Button
          variant='outline'
          className='border-white/10 bg-white/5 hover:bg-white/10'
          onClick={() => load()}
        >
          Rafraîchir
        </Button>
      </div>

      <div className='space-y-3'>
        {rows.map((row) => {
          const s = row.settings;
          const isSaving = saving === s.broker_name;
          const logo = row.broker.logo_url;

          return (
            <div
              key={row.broker.id}
              className={cn(
                'rounded-2xl p-5 md:p-6',
                'bg-zinc-900/40 backdrop-blur-sm',
                'border border-white/5',
                'transition-all duration-300',
                'hover:border-white/10 hover:bg-zinc-900/50'
              )}
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div className='flex items-start gap-4'>
                  <div className='relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5'>
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

                  <div className='space-y-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='text-base font-semibold'>{row.broker.name}</h3>
                      {s.is_maintenance ? (
                        <RendRBadge variant='warning' dot dotColor='red'>
                          Maintenance
                        </RendRBadge>
                      ) : s.is_available ? (
                        <RendRBadge variant='success' dot dotColor='green'>
                          Disponible
                        </RendRBadge>
                      ) : (
                        <RendRBadge variant='muted'>Désactivé</RendRBadge>
                      )}
                    </div>
                    {row.broker.description ? (
                      <p className='text-muted-foreground text-sm'>
                        {row.broker.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className='flex flex-col gap-3 md:min-w-[320px]'>
                  <div className='flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3'>
                    <div className='space-y-0.5'>
                      <p className='text-sm font-medium'>Disponible</p>
                      <p className='text-muted-foreground text-xs'>
                        Affiché comme connectable côté utilisateurs
                      </p>
                    </div>
                    <Switch
                      checked={s.is_available}
                      disabled={isSaving || s.is_maintenance}
                      onCheckedChange={(v) => onToggleAvailable(s.broker_name, v)}
                    />
                  </div>

                  <div className='flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3'>
                    <div className='space-y-0.5'>
                      <p className='text-sm font-medium'>Maintenance</p>
                      <p className='text-muted-foreground text-xs'>
                        Force l’indisponibilité + affiche un message
                      </p>
                    </div>
                    <Switch
                      checked={s.is_maintenance}
                      disabled={isSaving}
                      onCheckedChange={(v) => onToggleMaintenance(s.broker_name, v)}
                    />
                  </div>

                  <div className='space-y-2 rounded-xl border border-white/10 bg-white/5 p-3'>
                    <p className='text-sm font-medium'>Message</p>
                    {s.is_maintenance ? (
                      <>
                        <Textarea
                          value={draftMessages[s.broker_name] ?? ''}
                          onChange={(e) =>
                            setDraftMessages((prev) => ({
                              ...prev,
                              [s.broker_name]: e.target.value
                            }))
                          }
                          className='border-white/10 bg-white/5 focus:border-white/20'
                          placeholder='Ex: Maintenance planifiée jusqu’à 14:00 UTC'
                        />
                        <div className='flex justify-end'>
                          <Button
                            size='sm'
                            onClick={() => onSaveMessage(s.broker_name)}
                            disabled={isSaving}
                          >
                            Enregistrer
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Input
                        value={draftMessages[s.broker_name] ?? ''}
                        disabled
                        className='border-white/10 bg-white/5'
                        placeholder='Activez la maintenance pour définir un message'
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

