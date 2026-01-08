'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  IconPlus,
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconFlag,
  IconUser,
  IconEdit
} from '@tabler/icons-react';

type GoalStatus = 'active' | 'completed' | 'archived' | 'cancelled';
type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

type Goal = {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  priority: GoalPriority;
  due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
};

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch('/api/admin/goals');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json.goals || [];
}

async function createGoal(data: Partial<Goal>): Promise<Goal> {
  const res = await fetch('/api/admin/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la création');
  }
  return json.goal;
}

async function updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
  const res = await fetch(`/api/admin/goals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json.goal;
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/admin/goals/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Erreur lors de la suppression');
  }
}

function PriorityBadge({ priority }: { priority: GoalPriority }) {
  const colors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        colors[priority]
      )}
    >
      <IconFlag className='h-3 w-3' />
      {priority === 'low' && 'Faible'}
      {priority === 'medium' && 'Moyenne'}
      {priority === 'high' && 'Élevée'}
      {priority === 'urgent' && 'Urgente'}
    </span>
  );
}

function StatusBadge({ status }: { status: GoalStatus }) {
  const colors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-[#c5d13f]/20 text-[#c5d13f] border-[#c5d13f]/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const labels = {
    active: 'Actif',
    completed: 'Terminé',
    archived: 'Archivé',
    cancelled: 'Annulé'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        colors[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

export function AdminGoalsView() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);

  const loadGoals = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setGoals(await fetchGoals());
    } catch (e: any) {
      toast.error('Impossible de charger les objectifs', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (data: Partial<Goal>) => {
    try {
      const newGoal = await createGoal(data);
      setGoals([...goals, newGoal]);
      setIsDialogOpen(false);
      toast.success('Objectif créé avec succès');
    } catch (e: any) {
      toast.error('Erreur lors de la création', {
        description: e?.message
      });
    }
  };

  const handleUpdate = async (id: string, data: Partial<Goal>) => {
    try {
      const updated = await updateGoal(id, data);
      setGoals(goals.map((g) => (g.id === id ? updated : g)));
      setIsDialogOpen(false);
      setEditingGoal(null);
      toast.success('Objectif mis à jour');
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour', {
        description: e?.message
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;
    try {
      await deleteGoal(id);
      setGoals(goals.filter((g) => g.id !== id));
      toast.success('Objectif supprimé');
    } catch (e: any) {
      toast.error('Erreur lors de la suppression', {
        description: e?.message
      });
    }
  };

  const handleComplete = async (goal: Goal) => {
    await handleUpdate(goal.id, {
      status: goal.status === 'completed' ? 'active' : 'completed',
      completed_at:
        goal.status === 'completed' ? undefined : new Date().toISOString()
    });
  };

  const filteredGoals = React.useMemo(() => {
    const statusFilter = (g: Goal) =>
      g.status !== 'archived' && g.status !== 'cancelled';
    return goals.filter(statusFilter);
  }, [goals]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-32 animate-pulse rounded-xl bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header avec bouton créer */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Objectifs</h2>
          <p className='text-muted-foreground text-sm'>
            Gérez les objectifs de l'équipe
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className='h-4 w-4' />
              Nouvel objectif
            </Button>
          </DialogTrigger>
          <GoalDialog
            goal={editingGoal}
            onSave={(data) => {
              if (editingGoal) {
                handleUpdate(editingGoal.id, data);
              } else {
                handleCreate(data);
              }
            }}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingGoal(null);
            }}
          />
        </Dialog>
      </div>

      {/* Liste des objectifs */}
      {filteredGoals.length === 0 ? (
        <div
          className={cn(
            'rounded-xl p-12 text-center',
            'bg-zinc-900/50 backdrop-blur-sm',
            'border border-white/5'
          )}
        >
          <IconAlertCircle className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
          <p className='text-muted-foreground mb-2 font-medium'>
            Aucun objectif
          </p>
          <p className='text-muted-foreground/70 text-sm'>
            Créez votre premier objectif pour commencer
          </p>
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {
                setEditingGoal(goal);
                setIsDialogOpen(true);
              }}
              onDelete={() => handleDelete(goal.id)}
              onComplete={() => handleComplete(goal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const isOverdue =
    goal.due_date &&
    new Date(goal.due_date) < new Date() &&
    goal.status === 'active';

  return (
    <div
      className={cn(
        'group relative rounded-xl p-5 transition-all',
        'bg-zinc-900/50 backdrop-blur-sm',
        'border border-white/5',
        'hover:border-white/10 hover:bg-zinc-900/70'
      )}
    >
      <div className='mb-3 flex items-start justify-between'>
        <div className='flex-1'>
          <h3 className='mb-2 font-semibold'>{goal.title}</h3>
          <div className='mb-2 flex flex-wrap items-center gap-2'>
            <StatusBadge status={goal.status} />
            <PriorityBadge priority={goal.priority} />
          </div>
        </div>
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onComplete}
          >
            <IconCheck className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onEdit}
          >
            <IconEdit className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {goal.description && (
        <p className='text-muted-foreground mb-3 line-clamp-2 text-sm'>
          {goal.description}
        </p>
      )}

      <div className='flex items-center justify-between border-t border-white/5 pt-3'>
        {goal.due_date && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-400' : 'text-muted-foreground'
            )}
          >
            <IconClock className='h-3 w-3' />
            {new Date(goal.due_date).toLocaleDateString('fr-FR')}
          </div>
        )}
        {goal.assigned_to_name && (
          <div className='text-muted-foreground flex items-center gap-1 text-xs'>
            <IconUser className='h-3 w-3' />
            {goal.assigned_to_name}
          </div>
        )}
        <Button
          variant='ghost'
          size='sm'
          className='h-7 text-xs'
          onClick={onDelete}
        >
          <IconX className='h-3 w-3' />
        </Button>
      </div>
    </div>
  );
}

function GoalDialog({
  goal,
  onSave,
  onClose
}: {
  goal?: Goal | null;
  onSave: (data: Partial<Goal>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(goal?.title || '');
  const [description, setDescription] = React.useState(goal?.description || '');
  const [priority, setPriority] = React.useState<GoalPriority>(
    goal?.priority || 'medium'
  );
  const [dueDate, setDueDate] = React.useState(
    goal?.due_date ? goal.due_date.split('T')[0] : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate ? `${dueDate}T23:59:59Z` : undefined
    });
  };

  return (
    <DialogContent className='max-w-2xl'>
      <DialogHeader>
        <DialogTitle>
          {goal ? "Modifier l'objectif" : 'Nouvel objectif'}
        </DialogTitle>
        <DialogDescription>
          Créez un objectif pour votre équipe
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-2 block text-sm font-medium'>Titre *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ex: Améliorer le taux de conversion'
            required
          />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails de l'objectif..."
            rows={4}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='mb-2 block text-sm font-medium'>Priorité</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as GoalPriority)}
              className='border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
            >
              <option value='low'>Faible</option>
              <option value='medium'>Moyenne</option>
              <option value='high'>Élevée</option>
              <option value='urgent'>Urgente</option>
            </select>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium'>
              Date d'échéance
            </label>
            <Input
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className='flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={onClose}>
            Annuler
          </Button>
          <Button type='submit'>Enregistrer</Button>
        </div>
      </form>
    </DialogContent>
  );
}
