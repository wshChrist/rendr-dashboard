'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandDiscord,
  IconBrandGithub,
  IconMail,
  IconSend
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Veuillez entrer une adresse email valide'),
  subject: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères')
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const socialLinks = [
  {
    name: 'Twitter / X',
    icon: IconBrandTwitter,
    href: 'https://twitter.com/rendr',
    color: 'hover:text-[#1DA1F2]'
  },
  {
    name: 'LinkedIn',
    icon: IconBrandLinkedin,
    href: 'https://linkedin.com/company/rendr',
    color: 'hover:text-[#0077B5]'
  },
  {
    name: 'Discord',
    icon: IconBrandDiscord,
    href: 'https://discord.gg/rendr',
    color: 'hover:text-[#5865F2]'
  },
  {
    name: 'GitHub',
    icon: IconBrandGithub,
    href: 'https://github.com/rendr',
    color: 'hover:text-[#181717] dark:hover:text-white'
  },
  {
    name: 'Email',
    icon: IconMail,
    href: 'mailto:contact@rendr.com',
    color: 'hover:text-primary'
  }
];

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    try {
      // Ici vous pouvez ajouter l'appel API pour envoyer le message
      // Par exemple : await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })

      // Simulation d'envoi
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(t('contact.success.title'), {
        description: t('contact.success.description')
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(t('contact.error.title'), {
        description: t('contact.error.description')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>{t('contact.contactUs')}</DialogTitle>
          <DialogDescription>
            {t('contact.sendMessageOrFollow')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Réseaux sociaux */}
          <div>
            <h3 className='mb-3 text-sm font-medium'>
              {t('contact.socialNetworks')}
            </h3>
            <div className='flex flex-wrap gap-3'>
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2',
                      'bg-muted/50 hover:bg-muted',
                      'border-border border',
                      'transition-all duration-200',
                      'text-muted-foreground',
                      social.color
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    <span className='text-sm'>{social.name}</span>
                  </a>
                );
              })}
            </div>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background text-muted-foreground px-2'>
                {t('contact.orSendMessage')}
              </span>
            </div>
          </div>

          {/* Formulaire de contact */}
          <Form
            form={form}
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('forms.firstName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder={t('contact.emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='subject'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.subject')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('contact.subjectPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('contact.message')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('contact.messagePlaceholder')}
                      rows={5}
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? (
                <>{t('contact.sending')}</>
              ) : (
                <>
                  <IconSend className='mr-2 h-4 w-4' />
                  {t('contact.sendMessage')}
                </>
              )}
            </Button>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
