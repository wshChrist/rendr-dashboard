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
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconX,
  IconEdit
} from '@tabler/icons-react';

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  attendees_names?: string[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
};

async function fetchEvents(): Promise<CalendarEvent[]> {
  const res = await fetch('/api/admin/calendar');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json.events || [];
}

async function createEvent(
  data: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const res = await fetch('/api/admin/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la création');
  }
  return json.event;
}

async function updateEvent(
  id: string,
  data: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const res = await fetch(`/api/admin/calendar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json.event;
}

async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/admin/calendar/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Erreur lors de la suppression');
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Ajouter les jours du mois précédent pour compléter la semaine
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Ajouter les jours du mois
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Ajouter les jours du mois suivant pour compléter la semaine
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
  }

  return days;
}

export function AdminCalendarView() {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(
    null
  );

  const loadEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setEvents(await fetchEvents());
    } catch (e: any) {
      toast.error('Impossible de charger les événements', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async (data: Partial<CalendarEvent>) => {
    try {
      const newEvent = await createEvent(data);
      setEvents([...events, newEvent]);
      setIsDialogOpen(false);
      toast.success('Événement créé avec succès');
    } catch (e: any) {
      toast.error('Erreur lors de la création', {
        description: e?.message
      });
    }
  };

  const handleUpdate = async (id: string, data: Partial<CalendarEvent>) => {
    try {
      const updated = await updateEvent(id, data);
      setEvents(events.map((e) => (e.id === id ? updated : e)));
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast.success('Événement mis à jour');
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour', {
        description: e?.message
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      await deleteEvent(id);
      setEvents(events.filter((e) => e.id !== id));
      toast.success('Événement supprimé');
    } catch (e: any) {
      toast.error('Erreur lors de la suppression', {
        description: e?.message
      });
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });

  const getEventsForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.start_time);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (isLoading) {
    return <div className='h-96 animate-pulse rounded-xl bg-zinc-900/40' />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Calendrier</h2>
          <p className='text-muted-foreground text-sm'>
            Gérez les événements et rendez-vous de l'équipe
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className='h-4 w-4' />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <EventDialog
            event={editingEvent}
            onSave={(data) => {
              if (editingEvent) {
                handleUpdate(editingEvent.id, data);
              } else {
                handleCreate(data);
              }
            }}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingEvent(null);
            }}
          />
        </Dialog>
      </div>

      {/* Navigation du mois */}
      <div className='flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 p-4'>
        <Button variant='outline' onClick={() => navigateMonth('prev')}>
          ← Précédent
        </Button>
        <h3 className='text-lg font-semibold capitalize'>{monthName}</h3>
        <Button variant='outline' onClick={() => navigateMonth('next')}>
          Suivant →
        </Button>
      </div>

      {/* Calendrier */}
      <div className='rounded-xl border border-white/5 bg-zinc-900/50 p-4'>
        {/* En-têtes des jours */}
        <div className='mb-2 grid grid-cols-7 gap-2'>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div
              key={day}
              className='text-muted-foreground text-center text-sm font-medium'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className='grid grid-cols-7 gap-2'>
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={idx}
                className={cn(
                  'min-h-24 rounded-lg border p-2',
                  isCurrentMonth
                    ? 'border-white/10 bg-zinc-900/30'
                    : 'border-white/5 bg-zinc-900/10',
                  isToday && 'border-[#c5d13f]/30 bg-[#c5d13f]/5'
                )}
              >
                <div
                  className={cn(
                    'mb-1 text-sm font-medium',
                    isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                    isToday && 'text-[#c5d13f]'
                  )}
                >
                  {day.getDate()}
                </div>
                <div className='space-y-1'>
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className='cursor-pointer rounded bg-[#c5d13f]/20 px-1 py-0.5 text-xs text-[#c5d13f] hover:bg-[#c5d13f]/30'
                      onClick={() => {
                        setEditingEvent(event);
                        setIsDialogOpen(true);
                      }}
                    >
                      {formatTime(event.start_time)} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className='text-muted-foreground text-xs'>
                      +{dayEvents.length - 2} autre(s)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des événements du mois */}
      <div className='space-y-2'>
        <h3 className='font-semibold'>Événements du mois</h3>
        {events
          .filter((e) => {
            const eventDate = new Date(e.start_time);
            return (
              eventDate.getMonth() === currentDate.getMonth() &&
              eventDate.getFullYear() === currentDate.getFullYear()
            );
          })
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime()
          )
          .map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => {
                setEditingEvent(event);
                setIsDialogOpen(true);
              }}
              onDelete={() => handleDelete(event.id)}
            />
          ))}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group rounded-xl border p-4 transition-all',
        'bg-zinc-900/50 backdrop-blur-sm',
        'border-white/5',
        'hover:border-white/10 hover:bg-zinc-900/70'
      )}
    >
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <h4 className='mb-2 font-semibold'>{event.title}</h4>
          <div className='text-muted-foreground space-y-1 text-sm'>
            <div className='flex items-center gap-2'>
              <IconCalendar className='h-4 w-4' />
              {formatDate(event.start_time)}
            </div>
            <div className='flex items-center gap-2'>
              <IconClock className='h-4 w-4' />
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </div>
            {event.location && (
              <div className='flex items-center gap-2'>
                <IconMapPin className='h-4 w-4' />
                {event.location}
              </div>
            )}
            {event.attendees_names && event.attendees_names.length > 0 && (
              <div className='flex items-center gap-2'>
                <IconUsers className='h-4 w-4' />
                {event.attendees_names.join(', ')}
              </div>
            )}
          </div>
          {event.description && (
            <p className='text-muted-foreground mt-2 text-sm'>
              {event.description}
            </p>
          )}
        </div>
        <div className='flex gap-1'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onEdit}
          >
            <IconEdit className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onDelete}
          >
            <IconX className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EventDialog({
  event,
  onSave,
  onClose
}: {
  event?: CalendarEvent | null;
  onSave: (data: Partial<CalendarEvent>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(event?.title || '');
  const [description, setDescription] = React.useState(
    event?.description || ''
  );
  const [startTime, setStartTime] = React.useState(
    event?.start_time
      ? new Date(event.start_time).toISOString().slice(0, 16)
      : ''
  );
  const [endTime, setEndTime] = React.useState(
    event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : ''
  );
  const [location, setLocation] = React.useState(event?.location || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (!startTime || !endTime) {
      toast.error('Les dates de début et fin sont requises');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      location: location.trim() || undefined
    });
  };

  return (
    <DialogContent className='max-w-2xl'>
      <DialogHeader>
        <DialogTitle>
          {event ? "Modifier l'événement" : 'Nouvel événement'}
        </DialogTitle>
        <DialogDescription>
          Créez un événement dans le calendrier
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-2 block text-sm font-medium'>Titre *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ex: Réunion équipe'
            required
          />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails de l'événement..."
            rows={3}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='mb-2 block text-sm font-medium'>
              Date et heure de début *
            </label>
            <Input
              type='datetime-local'
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium'>
              Date et heure de fin *
            </label>
            <Input
              type='datetime-local'
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Lieu</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder='Ex: Bureau principal'
          />
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
