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
  IconFileText,
  IconEdit,
  IconTrash,
  IconFolder,
  IconSearch,
  IconAlertCircle
} from '@tabler/icons-react';

type DocumentBlock = {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote';
  content: string;
  id: string;
};

type Document = {
  id: string;
  title: string;
  content: DocumentBlock[];
  parent_id?: string;
  is_archived: boolean;
  created_by: string;
  created_by_name?: string;
  updated_by?: string;
  updated_by_name?: string;
  created_at: string;
  updated_at: string;
};

async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch('/api/admin/documents');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors du chargement');
  }
  return json.documents || [];
}

async function createDocument(data: Partial<Document>): Promise<Document> {
  const res = await fetch('/api/admin/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la création');
  }
  return json.document;
}

async function updateDocument(
  id: string,
  data: Partial<Document>
): Promise<Document> {
  const res = await fetch(`/api/admin/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Erreur lors de la mise à jour');
  }
  return json.document;
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/admin/documents/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'Erreur lors de la suppression');
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function AdminDocumentsView() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDocument, setEditingDocument] = React.useState<Document | null>(
    null
  );
  const [viewingDocument, setViewingDocument] = React.useState<Document | null>(
    null
  );
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      setDocuments(await fetchDocuments());
    } catch (e: any) {
      toast.error('Impossible de charger les documents', {
        description: e?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreate = async (data: Partial<Document>) => {
    try {
      const newDoc = await createDocument(data);
      setDocuments([...documents, newDoc]);
      setIsDialogOpen(false);
      toast.success('Document créé avec succès');
    } catch (e: any) {
      toast.error('Erreur lors de la création', {
        description: e?.message
      });
    }
  };

  const handleUpdate = async (id: string, data: Partial<Document>) => {
    try {
      const updated = await updateDocument(id, data);
      setDocuments(documents.map((d) => (d.id === id ? updated : d)));
      setIsDialogOpen(false);
      setEditingDocument(null);
      toast.success('Document mis à jour');
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour', {
        description: e?.message
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    try {
      await deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
      if (viewingDocument?.id === id) {
        setViewingDocument(null);
      }
      toast.success('Document supprimé');
    } catch (e: any) {
      toast.error('Erreur lors de la suppression', {
        description: e?.message
      });
    }
  };

  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return documents.filter((d) => !d.is_archived);
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (d) =>
        !d.is_archived &&
        (d.title.toLowerCase().includes(query) ||
          d.content.some((block) =>
            block.content.toLowerCase().includes(query)
          ))
    );
  }, [documents, searchQuery]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='h-24 animate-pulse rounded-xl bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Documents</h2>
          <p className='text-muted-foreground text-sm'>
            Espace de documentation collaboratif
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className='h-4 w-4' />
              Nouveau document
            </Button>
          </DialogTrigger>
          <DocumentDialog
            document={editingDocument}
            onSave={(data) => {
              if (editingDocument) {
                handleUpdate(editingDocument.id, data);
              } else {
                handleCreate(data);
              }
            }}
            onClose={() => {
              setIsDialogOpen(false);
              setEditingDocument(null);
            }}
          />
        </Dialog>
      </div>

      {/* Recherche */}
      <div className='relative'>
        <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          placeholder='Rechercher dans les documents...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Vue principale : Liste ou Document */}
      {viewingDocument ? (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
          onEdit={() => {
            setEditingDocument(viewingDocument);
            setIsDialogOpen(true);
          }}
          onDelete={() => {
            handleDelete(viewingDocument.id);
            setViewingDocument(null);
          }}
        />
      ) : (
        <>
          {filteredDocuments.length === 0 ? (
            <div
              className={cn(
                'rounded-xl p-12 text-center',
                'bg-zinc-900/50 backdrop-blur-sm',
                'border border-white/5'
              )}
            >
              <IconAlertCircle className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-muted-foreground mb-2 font-medium'>
                Aucun document
              </p>
              <p className='text-muted-foreground/70 text-sm'>
                Créez votre premier document pour commencer
              </p>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={() => setViewingDocument(doc)}
                  onEdit={() => {
                    setEditingDocument(doc);
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => handleDelete(doc.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocumentCard({
  document,
  onView,
  onEdit,
  onDelete
}: {
  document: Document;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const preview =
    document.content
      .find((b) => b.type === 'paragraph')
      ?.content.slice(0, 100) || 'Aucun contenu';

  return (
    <div
      className={cn(
        'group relative rounded-xl p-5 transition-all',
        'bg-zinc-900/50 backdrop-blur-sm',
        'border border-white/5',
        'hover:border-white/10 hover:bg-zinc-900/70',
        'cursor-pointer'
      )}
      onClick={onView}
    >
      <div className='mb-3 flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <IconFileText className='h-5 w-5 text-[#c5d13f]' />
          <h3 className='font-semibold'>{document.title}</h3>
        </div>
        <div className='flex gap-1' onClick={(e) => e.stopPropagation()}>
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
            <IconTrash className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <p className='text-muted-foreground mb-3 line-clamp-3 text-sm'>
        {preview}
      </p>

      <div className='text-muted-foreground/70 flex items-center justify-between border-t border-white/5 pt-3 text-xs'>
        <span>Modifié {formatDate(document.updated_at)}</span>
        {document.updated_by_name && (
          <span>par {document.updated_by_name}</span>
        )}
      </div>
    </div>
  );
}

function DocumentViewer({
  document,
  onClose,
  onEdit,
  onDelete
}: {
  document: Document;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-xl p-6',
        'bg-zinc-900/50 backdrop-blur-sm',
        'border border-white/5'
      )}
    >
      <div className='mb-6 flex items-start justify-between'>
        <div className='flex-1'>
          <h1 className='mb-2 text-3xl font-bold'>{document.title}</h1>
          <div className='text-muted-foreground flex items-center gap-4 text-sm'>
            <span>Créé {formatDate(document.created_at)}</span>
            <span>•</span>
            <span>Modifié {formatDate(document.updated_at)}</span>
            {document.updated_by_name && (
              <>
                <span>•</span>
                <span>par {document.updated_by_name}</span>
              </>
            )}
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={onEdit}>
            <IconEdit className='h-4 w-4' />
            Modifier
          </Button>
          <Button variant='outline' onClick={onDelete}>
            <IconTrash className='h-4 w-4' />
            Supprimer
          </Button>
          <Button variant='outline' onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      <div className='prose prose-invert max-w-none space-y-4'>
        {document.content.length === 0 ? (
          <p className='text-muted-foreground italic'>
            Ce document est vide. Cliquez sur Modifier pour ajouter du contenu.
          </p>
        ) : (
          document.content.map((block) => (
            <DocumentBlockRenderer key={block.id} block={block} />
          ))
        )}
      </div>
    </div>
  );
}

function DocumentBlockRenderer({ block }: { block: DocumentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className='text-2xl font-bold'>{block.content}</h2>;
    case 'paragraph':
      return <p className='leading-relaxed'>{block.content}</p>;
    case 'list':
      const items = block.content.split('\n').filter((i) => i.trim());
      return (
        <ul className='list-disc pl-6'>
          {items.map((item, idx) => (
            <li key={idx}>{item.trim()}</li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <pre className='rounded-lg bg-zinc-800 p-4'>
          <code>{block.content}</code>
        </pre>
      );
    case 'quote':
      return (
        <blockquote className='border-l-4 border-[#c5d13f] pl-4 italic'>
          {block.content}
        </blockquote>
      );
    default:
      return <p>{block.content}</p>;
  }
}

function DocumentDialog({
  document,
  onSave,
  onClose
}: {
  document?: Document | null;
  onSave: (data: Partial<Document>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState(document?.title || '');
  const [content, setContent] = React.useState(
    document?.content
      ?.map((b) => {
        if (b.type === 'heading') return `# ${b.content}`;
        if (b.type === 'list') return `- ${b.content}`;
        if (b.type === 'code') return `\`\`\`\n${b.content}\n\`\`\``;
        if (b.type === 'quote') return `> ${b.content}`;
        return b.content;
      })
      .join('\n\n') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    // Parser le contenu markdown simple
    const blocks: DocumentBlock[] = [];
    const lines = content.split('\n\n');
    let blockId = 0;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          type: 'heading',
          content: line.slice(2),
          id: `block-${blockId++}`
        });
      } else if (line.startsWith('> ')) {
        blocks.push({
          type: 'quote',
          content: line.slice(2),
          id: `block-${blockId++}`
        });
      } else if (line.startsWith('```')) {
        const codeContent = line.split('\n').slice(1, -1).join('\n');
        blocks.push({
          type: 'code',
          content: codeContent,
          id: `block-${blockId++}`
        });
      } else if (line.startsWith('- ')) {
        blocks.push({
          type: 'list',
          content: line,
          id: `block-${blockId++}`
        });
      } else if (line.trim()) {
        blocks.push({
          type: 'paragraph',
          content: line,
          id: `block-${blockId++}`
        });
      }
    }

    onSave({
      title: title.trim(),
      content: blocks.length > 0 ? blocks : undefined
    });
  };

  return (
    <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
      <DialogHeader>
        <DialogTitle>
          {document ? 'Modifier le document' : 'Nouveau document'}
        </DialogTitle>
        <DialogDescription>
          Utilisez Markdown simple : # pour titre, - pour liste, {'>'} pour
          citation, ``` pour code
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-2 block text-sm font-medium'>Titre *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Titre du document'
            required
          />
        </div>

        <div>
          <label className='mb-2 block text-sm font-medium'>Contenu</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='# Titre\n\nParagraphe de texte...\n\n- Liste\n- Items\n\n> Citation'
            rows={15}
            className='font-mono text-sm'
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
