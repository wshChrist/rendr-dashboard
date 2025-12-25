'use client';

import { createSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { RendRBadge } from '@/components/ui/rendr-badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTradingData } from '@/hooks/use-trading-data';
import {
  AnimatedNumber,
  AnimatedInteger
} from '@/components/ui/animated-number';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconShieldCheck,
  IconBell,
  IconWallet,
  IconCreditCard,
  IconBrandPaypal,
  IconCurrencyBitcoin,
  IconEdit,
  IconCheck,
  IconChartBar,
  IconTrendingUp,
  IconCopy,
  IconLock,
  IconDeviceDesktop,
  IconHistory,
  IconSettings,
  IconAlertTriangle,
  IconUpload
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Types pour les formulaires
type ProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ProfileViewPage() {
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createSupabaseClient();
  const router = useRouter();
  const {
    transactions,
    accounts,
    isLoading: isLoadingTradingData
  } = useTradingData();

  // Calculer les stats depuis les données réelles
  const stats = useMemo(() => {
    const totalCashback = transactions.reduce(
      (acc, t) => acc + t.cashback_amount,
      0
    );
    const totalVolume = transactions.reduce((acc, t) => acc + t.volume, 0);
    const totalTrades = transactions.length;
    const activeBrokers = accounts.filter(
      (a) => a.status === 'connected'
    ).length;

    // Calculer le solde disponible : total cashback moins retraits (0 pour l'instant)
    // TODO: Calculer depuis la table withdrawals quand elle sera disponible
    const totalWithdrawn = 0;
    const availableBalance = totalCashback - totalWithdrawn;
    const pendingCashback = 0; // Pour l'instant, on considère que tout est disponible

    return {
      total_cashback_earned: totalCashback,
      available_balance: Math.max(0, availableBalance), // S'assurer qu'il n'est pas négatif
      pending_cashback: pendingCashback,
      total_withdrawn: totalWithdrawn,
      total_volume: totalVolume,
      total_trades: totalTrades,
      active_brokers: activeBrokers
    };
  }, [transactions, accounts]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [tradingAlerts, setTradingAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoaded(true);
    };

    getUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // États pour les dialogues
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [editBankDialogOpen, setEditBankDialogOpen] = useState(false);
  const [addPaypalDialogOpen, setAddPaypalDialogOpen] = useState(false);
  const [addCryptoDialogOpen, setAddCryptoDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // États pour les formulaires
  const [bankAccount, setBankAccount] = useState('FR76 •••• •••• •••• 4532');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Créer les schémas de validation avec les traductions
  const profileFormSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('profile.validation.firstNameMin')),
        lastName: z.string().min(2, t('profile.validation.lastNameMin')),
        email: z.string().email(t('profile.validation.invalidEmail')),
        avatar: z.string().optional()
      }),
    [t]
  );

  const passwordFormSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t('profile.validation.currentPasswordRequired')),
          newPassword: z
            .string()
            .min(8, t('profile.validation.newPasswordMin')),
          confirmPassword: z
            .string()
            .min(1, t('profile.validation.confirmPasswordRequired'))
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('profile.validation.passwordsDoNotMatch'),
          path: ['confirmPassword']
        }),
    [t]
  );

  // Formulaires react-hook-form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      email: user?.email || '',
      avatar: user?.user_metadata?.avatar_url || ''
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Mettre à jour les valeurs par défaut quand le dialogue s'ouvre
  useEffect(() => {
    if (user && editProfileDialogOpen) {
      profileForm.reset({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || ''
      });
      setAvatarPreview(user.user_metadata?.avatar_url || null);
      setAvatarFile(null);
      setUploadedAvatarUrl(null);
    }
  }, [user, editProfileDialogOpen, profileForm]);

  if (!isLoaded || isLoadingTradingData) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='border-foreground h-8 w-8 animate-spin rounded-full border-2 border-t-transparent' />
      </div>
    );
  }

  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const fullNameFromMetadata =
    user?.user_metadata?.name || user?.user_metadata?.full_name || '';
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : fullNameFromMetadata
        ? fullNameFromMetadata
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : firstName?.[0]?.toUpperCase() ||
          user?.email?.[0]?.toUpperCase() ||
          'U';

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), 'MMMM yyyy', { locale: fr })
    : 'Récemment';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const handleEditProfile = () => {
    if (user) {
      profileForm.reset({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || ''
      });
      setAvatarPreview(user.user_metadata?.avatar_url || null);
      setEditProfileDialogOpen(true);
      setAvatarFile(null);
      setUploadedAvatarUrl(null);
    }
  };

  const handleSaveProfile = async (data: ProfileFormValues) => {
    try {
      if (!user) {
        toast.error(t('auth.userNotConnected'));
        return;
      }

      // Utiliser l'URL uploadée si disponible, sinon utiliser celle du formulaire ou celle existante
      let avatarUrl =
        uploadedAvatarUrl ||
        data.avatar ||
        user.user_metadata?.avatar_url ||
        '';

      // Construire le nom complet
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      // Mettre à jour les métadonnées utilisateur
      const { data: updatedUserData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            name: fullName,
            full_name: fullName,
            avatar_url: avatarUrl || undefined
          }
        });

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour l'état local
      setUser(updatedUserData.user);
      setAvatarFile(null);
      setAvatarPreview(null);
      setUploadedAvatarUrl(null);

      toast.success(t('profile.profileUpdatedSuccess'));
      setEditProfileDialogOpen(false);

      // Recharger la page pour s'assurer que tous les composants sont à jour
      router.refresh();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error.message || t('profile.profileUpdateError'));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    setAvatarFile(file);
    setIsUploadingAvatar(true);

    try {
      if (!user) {
        toast.error(t('auth.userNotConnected'));
        return;
      }

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Uploader directement vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Si le bucket n'existe pas, utiliser une URL object pour prévisualiser
        console.warn(
          'Erreur upload avatar (bucket peut-être inexistant):',
          uploadError
        );
        // Créer une URL temporaire pour la prévisualisation
        const tempUrl = URL.createObjectURL(file);
        setAvatarPreview(tempUrl);
        profileForm.setValue('avatar', tempUrl);
        toast.warning(
          'Le bucket "avatars" n\'existe pas encore. Créez-le dans Supabase Storage pour sauvegarder l\'image.'
        );
      } else {
        // Récupérer l'URL publique de l'image
        const {
          data: { publicUrl }
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        setUploadedAvatarUrl(publicUrl);
        setAvatarPreview(publicUrl);
        profileForm.setValue('avatar', publicUrl);
        toast.success('Image uploadée avec succès');
      }
    } catch (error: any) {
      console.error("Erreur lors de l'upload de l'avatar:", error);
      toast.error("Erreur lors de l'upload de l'image");
      // Créer une URL temporaire pour la prévisualisation en cas d'erreur
      const tempUrl = URL.createObjectURL(file);
      setAvatarPreview(tempUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditBankAccount = () => {
    setEditBankDialogOpen(true);
  };

  const handleSaveBankAccount = () => {
    // Ici vous pouvez ajouter la logique pour sauvegarder les informations bancaires
    toast.success(t('profile.bankInfoUpdated'));
    setEditBankDialogOpen(false);
  };

  const handleAddPaypal = () => {
    setAddPaypalDialogOpen(true);
  };

  const handleSavePaypal = () => {
    if (!paypalEmail || !paypalEmail.includes('@')) {
      toast.error('Veuillez entrer une adresse email PayPal valide');
      return;
    }
    toast.success('PayPal ajouté avec succès');
    setAddPaypalDialogOpen(false);
    setPaypalEmail('');
  };

  const handleAddCrypto = () => {
    setAddCryptoDialogOpen(true);
  };

  const handleSaveCrypto = () => {
    if (!cryptoAddress || cryptoAddress.length < 20) {
      toast.error('Veuillez entrer une adresse crypto valide');
      return;
    }
    toast.success('Adresse crypto ajoutée avec succès');
    setAddCryptoDialogOpen(false);
    setCryptoAddress('');
  };

  const handleChangePassword = () => {
    passwordForm.reset({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setChangePasswordDialogOpen(true);
  };

  const handleSavePassword = async (data: PasswordFormValues) => {
    try {
      // Ici vous pouvez ajouter la logique pour changer le mot de passe via votre API
      // Exemple: await fetch('/api/auth/change-password', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     currentPassword: data.currentPassword,
      //     newPassword: data.newPassword
      //   })
      // });
      toast.success('Mot de passe changé avec succès');
      setChangePasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
      console.error(error);
    }
  };

  const handleViewSessions = () => {
    setSessionsDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user) {
        toast.error('Aucun utilisateur connecté');
        setDeleteAccountDialogOpen(false);
        return;
      }

      // Afficher un toast de chargement
      const loadingToast = toast.loading('Suppression du compte en cours...');

      // Appeler l'API pour supprimer le compte
      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      });

      const data = await response.json();

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la suppression du compte');
        setDeleteAccountDialogOpen(false);
        return;
      }

      // Succès
      toast.success('Compte supprimé avec succès');
      setDeleteAccountDialogOpen(false);

      // Rediriger vers la page de connexion
      setTimeout(() => {
        router.push('/auth/sign-in');
        router.refresh();
      }, 1000);
    } catch (error) {
      toast.error('Erreur lors de la suppression du compte');
      console.error(error);
      setDeleteAccountDialogOpen(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header avec avatar - Style RendR */}
      <div
        className={cn(
          'rounded-2xl p-6 md:p-8',
          'bg-zinc-900/40 backdrop-blur-sm',
          'border border-white/5',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationFillMode: 'forwards' }}
      >
        <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
          <div className='flex items-center gap-6'>
            <div className='relative'>
              <Avatar className='h-24 w-24 border-2 border-white/10'>
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={user?.user_metadata?.name || 'Avatar'}
                />
                <AvatarFallback className='text-foreground bg-white/10 text-2xl font-bold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='absolute -right-1 -bottom-1 rounded-full border-2 border-zinc-900 bg-[#c5d13f] p-1.5'>
                <IconShieldCheck className='h-4 w-4 text-zinc-900' />
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
                  {user?.user_metadata?.name ||
                    user?.user_metadata?.full_name ||
                    `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
                    'Trader'}
                </h1>
                <RendRBadge variant='success' dot dotColor='green'>
                  Vérifié
                </RendRBadge>
              </div>
              <div className='text-muted-foreground flex flex-wrap items-center gap-4'>
                <span className='flex items-center gap-2'>
                  <IconMail className='h-4 w-4' />
                  <span className='text-sm'>{user?.email}</span>
                </span>
                <span className='flex items-center gap-2'>
                  <IconCalendar className='h-4 w-4' />
                  <span className='text-sm'>
                    {t('profile.memberSince')} {memberSince}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <Button
            variant='outline'
            className='border-white/10 bg-white/5 hover:bg-white/10'
            onClick={handleEditProfile}
          >
            <IconEdit className='mr-2 h-4 w-4' />
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>

      {/* Stats rapides - Style RendR */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-[#c5d13f]/20',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
              <IconWallet className='h-5 w-5 text-[#c5d13f]' />
            </div>
            <span className='text-muted-foreground text-sm'>
              {t('stats.availableBalance')}
            </span>
          </div>
          <p className='stat-number text-3xl font-bold text-[#c5d13f]'>
            <AnimatedNumber value={stats.available_balance} suffix='€' />
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconTrendingUp className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Total cashback
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            <AnimatedNumber value={stats.total_cashback_earned} suffix='€' />
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconChartBar className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Trades exécutés
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            <AnimatedInteger value={stats.total_trades} />
          </p>
        </div>

        <div
          className={cn(
            'rounded-2xl p-5',
            'bg-zinc-900/40 backdrop-blur-sm',
            'border border-white/5',
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          <div className='mb-3 flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconUser className='h-5 w-5' />
            </div>
            <span className='text-muted-foreground text-sm'>
              Brokers actifs
            </span>
          </div>
          <p className='stat-number text-3xl font-bold'>
            <AnimatedInteger value={stats.active_brokers} />
          </p>
        </div>
      </div>

      {/* Tabs principales - Style RendR */}
      <Tabs defaultValue='payments' className='space-y-6'>
        <TabsList className='rounded-xl border border-white/5 bg-white/5 p-1'>
          <TabsTrigger
            value='payments'
            className='data-[state=active]:text-foreground rounded-lg data-[state=active]:bg-white/10'
          >
            <IconWallet className='mr-2 h-4 w-4' />
            {t('profile.tabs.payments')}
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='data-[state=active]:text-foreground rounded-lg data-[state=active]:bg-white/10'
          >
            <IconBell className='mr-2 h-4 w-4' />
            {t('profile.tabs.notifications')}
          </TabsTrigger>
          <TabsTrigger
            value='security'
            className='data-[state=active]:text-foreground rounded-lg data-[state=active]:bg-white/10'
          >
            <IconLock className='mr-2 h-4 w-4' />
            {t('profile.tabs.security')}
          </TabsTrigger>
        </TabsList>

        {/* Méthodes de paiement */}
        <TabsContent value='payments' className='space-y-6'>
          {/* Méthodes de retrait */}
          <div
            className={cn(
              'rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-6 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconCreditCard className='h-4 w-4' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>Méthodes de retrait</h3>
                <p className='text-muted-foreground text-sm'>
                  Configurez vos méthodes de paiement préférées
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              {/* Virement bancaire */}
              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
                    <IconCreditCard className='h-6 w-6' />
                  </div>
                  <div>
                    <p className='font-medium'>{t('profile.bankTransfer')}</p>
                    <p className='text-muted-foreground text-sm'>
                      FR76 •••• •••• •••• 4532
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <RendRBadge variant='accent' dot dotColor='green'>
                    Par défaut
                  </RendRBadge>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='hover:bg-white/5'
                    onClick={handleEditBankAccount}
                  >
                    <IconEdit className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* PayPal */}
              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
                    <IconBrandPaypal className='h-6 w-6' />
                  </div>
                  <div>
                    <p className='font-medium'>PayPal</p>
                    <p className='text-muted-foreground text-sm'>
                      Non configuré
                    </p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-white/10 bg-white/5'
                >
                  {t('profile.add')}
                </Button>
              </div>

              {/* Crypto */}
              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='flex items-center gap-4'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
                    <IconCurrencyBitcoin className='h-6 w-6' />
                  </div>
                  <div>
                    <p className='font-medium'>Crypto (USDT)</p>
                    <p className='text-muted-foreground text-sm'>
                      Non configuré
                    </p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-white/10 bg-white/5'
                  onClick={handleAddCrypto}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Historique des retraits */}
          <div
            className={cn(
              'rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-6 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconHistory className='h-4 w-4' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>
                  {t('profile.lastWithdrawals')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  Historique de vos retraits récents
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              {stats.total_withdrawn > 0 ? (
                // TODO: Afficher les retraits réels quand la table withdrawals sera disponible
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'rounded-xl p-8',
                    'border border-white/5 bg-white/5'
                  )}
                >
                  <p className='text-muted-foreground text-center text-sm'>
                    Historique des retraits disponible prochainement
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'rounded-xl p-8',
                    'border border-white/5 bg-white/5'
                  )}
                >
                  <p className='text-muted-foreground text-center text-sm'>
                    Aucun retrait effectué pour le moment
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value='notifications' className='space-y-6'>
          <div
            className={cn(
              'rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-6 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconBell className='h-4 w-4' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>
                  {t('profile.notifications.title')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {t('profile.notifications.description')}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='space-y-1'>
                  <Label
                    htmlFor='email-notifications'
                    className='text-base font-medium'
                  >
                    {t('profile.notifications.emailNotifications')}
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('profile.notifications.emailDescription')}
                  </p>
                </div>
                <Switch
                  id='email-notifications'
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='space-y-1'>
                  <Label
                    htmlFor='trading-alerts'
                    className='text-base font-medium'
                  >
                    Alertes de trading
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    Soyez notifié quand vos trades sont synchronisés
                  </p>
                </div>
                <Switch
                  id='trading-alerts'
                  checked={tradingAlerts}
                  onCheckedChange={setTradingAlerts}
                />
              </div>

              <div
                className={cn(
                  'flex items-center justify-between',
                  'rounded-xl p-4',
                  'border border-white/5 bg-white/5',
                  'transition-all duration-200',
                  'hover:bg-white/10'
                )}
              >
                <div className='space-y-1'>
                  <Label
                    htmlFor='weekly-report'
                    className='text-base font-medium'
                  >
                    Rapport hebdomadaire
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    Recevez un récapitulatif de votre activité chaque semaine
                  </p>
                </div>
                <Switch
                  id='weekly-report'
                  checked={weeklyReport}
                  onCheckedChange={setWeeklyReport}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value='security' className='space-y-6'>
          <div
            className={cn(
              'rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-white/5',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-6 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconLock className='h-4 w-4' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>
                  {t('profile.accountSecurity')}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {t('profile.accountSecurityDescription')}
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Email */}
              <div className='space-y-2'>
                <Label>{t('profile.loginEmail')}</Label>
                <div className='flex gap-2'>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className='flex-1 border-white/10 bg-white/5'
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    className='border-white/10 bg-white/5 hover:bg-white/10'
                    onClick={() => copyToClipboard(user?.email || '')}
                  >
                    <IconCopy className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Actions de sécurité */}
              <div className='space-y-3 border-t border-white/5 pt-4'>
                <div
                  className={cn(
                    'flex items-center justify-between',
                    'rounded-xl p-4',
                    'border border-white/5 bg-white/5',
                    'transition-all duration-200',
                    'hover:bg-white/10'
                  )}
                >
                  <div>
                    <p className='font-medium'>{t('profile.changePassword')}</p>
                    <p className='text-muted-foreground text-sm'>
                      Dernière modification il y a 3 mois
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-white/10 bg-white/5 hover:bg-white/10'
                    onClick={handleChangePassword}
                  >
                    Modifier
                  </Button>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between',
                    'rounded-xl p-4',
                    'border border-white/5 bg-white/5',
                    'transition-all duration-200',
                    'hover:bg-white/10'
                  )}
                >
                  <div>
                    <p className='font-medium'>
                      Authentification à deux facteurs
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {t('profile.addSecurityLayer')}
                    </p>
                  </div>
                  <RendRBadge variant='outline'>
                    {t('profile.notActivated')}
                  </RendRBadge>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between',
                    'rounded-xl p-4',
                    'border border-white/5 bg-white/5',
                    'transition-all duration-200',
                    'hover:bg-white/10'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
                      <IconDeviceDesktop className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='font-medium'>
                        {t('profile.activeSessions')}
                      </p>
                      <p className='text-muted-foreground text-sm'>
                        1 appareil connecté
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='hover:bg-white/5'
                    onClick={handleViewSessions}
                  >
                    Voir tout
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Zone dangereuse */}
          <div
            className={cn(
              'rounded-2xl p-6',
              'bg-zinc-900/40 backdrop-blur-sm',
              'border border-red-500/20',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
          >
            <div className='mb-4 flex items-center gap-2'>
              <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-2'>
                <IconAlertTriangle className='h-4 w-4 text-red-400' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-red-400'>
                  Zone dangereuse
                </h3>
                <p className='text-muted-foreground text-sm'>
                  Actions irréversibles sur votre compte
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-center justify-between',
                'rounded-xl p-4',
                'border border-red-500/10 bg-red-500/5',
                'transition-all duration-200',
                'hover:bg-red-500/10'
              )}
            >
              <div>
                <p className='font-medium'>{t('profile.deleteAccount')}</p>
                <p className='text-muted-foreground text-sm'>
                  Cette action est irréversible. Toutes vos données seront
                  perdues.
                </p>
              </div>
              <Button
                variant='outline'
                className='border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                onClick={() => setDeleteAccountDialogOpen(true)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogue pour éditer le profil */}
      <Dialog
        open={editProfileDialogOpen}
        onOpenChange={setEditProfileDialogOpen}
      >
        <DialogContent className='max-w-2xl border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
            <DialogDescription>
              {t('profile.personalInfo.title')}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={profileForm.handleSubmit(handleSaveProfile)}
            className='space-y-6'
          >
            <div className='space-y-4'>
              {/* Avatar */}
              <div className='flex flex-col items-center gap-4'>
                <div className='relative'>
                  <Avatar className='h-24 w-24 border-2 border-white/10'>
                    <AvatarImage
                      src={
                        avatarPreview || user?.user_metadata?.avatar_url || ''
                      }
                      alt='Avatar'
                    />
                    <AvatarFallback className='text-foreground bg-white/10 text-2xl font-bold'>
                      {profileForm.watch('firstName')?.[0]?.toUpperCase() || ''}
                      {profileForm.watch('lastName')?.[0]?.toUpperCase() || ''}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='absolute -right-1 -bottom-1 h-8 w-8 rounded-full border-white/10 bg-zinc-800'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                    ) : (
                      <IconUpload className='h-4 w-4' />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleAvatarUpload}
                  />
                </div>
                <p className='text-muted-foreground text-center text-sm'>
                  Cliquez sur l'icône pour changer votre photo de profil
                </p>
              </div>

              {/* Prénom */}
              <div className='space-y-2'>
                <Label htmlFor='firstName'>{t('auth.signUp.firstName')}</Label>
                <Input
                  id='firstName'
                  {...profileForm.register('firstName')}
                  className='border-white/10 bg-white/5'
                  placeholder={t('forms.firstName')}
                />
                {profileForm.formState.errors.firstName && (
                  <p className='text-sm text-red-400'>
                    {profileForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div className='space-y-2'>
                <Label htmlFor='lastName'>{t('auth.signUp.lastName')}</Label>
                <Input
                  id='lastName'
                  {...profileForm.register('lastName')}
                  className='border-white/10 bg-white/5'
                  placeholder={t('forms.lastName')}
                />
                {profileForm.formState.errors.lastName && (
                  <p className='text-sm text-red-400'>
                    {profileForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  {...profileForm.register('email')}
                  className='border-white/10 bg-white/5'
                  placeholder='votre@email.com'
                />
                {profileForm.formState.errors.email && (
                  <p className='text-sm text-red-400'>
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditProfileDialogOpen(false)}
                className='border-white/10 bg-white/5'
              >
                {t('common.cancel')}
              </Button>
              <Button
                type='submit'
                disabled={profileForm.formState.isSubmitting}
                className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
              >
                {profileForm.formState.isSubmitting
                  ? t('common.processing')
                  : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour changer le mot de passe */}
      <Dialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
      >
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.changePassword')}</DialogTitle>
            <DialogDescription>{t('profile.password.title')}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={passwordForm.handleSubmit(handleSavePassword)}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>
                {t('profile.currentPassword')}
              </Label>
              <Input
                id='currentPassword'
                type='password'
                {...passwordForm.register('currentPassword')}
                className='border-white/10 bg-white/5'
                placeholder='••••••••'
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className='text-sm text-red-400'>
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='newPassword'>{t('profile.newPassword')}</Label>
              <Input
                id='newPassword'
                type='password'
                {...passwordForm.register('newPassword')}
                className='border-white/10 bg-white/5'
                placeholder='••••••••'
              />
              {passwordForm.formState.errors.newPassword && (
                <p className='text-sm text-red-400'>
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
              <p className='text-muted-foreground text-xs'>
                Au moins 8 caractères, incluant des lettres et des chiffres
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>
                {t('profile.password.confirm')}
              </Label>
              <Input
                id='confirmPassword'
                type='password'
                {...passwordForm.register('confirmPassword')}
                className='border-white/10 bg-white/5'
                placeholder='••••••••'
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className='text-sm text-red-400'>
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setChangePasswordDialogOpen(false)}
                className='border-white/10 bg-white/5'
              >
                {t('common.cancel')}
              </Button>
              <Button
                type='submit'
                disabled={passwordForm.formState.isSubmitting}
                className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
              >
                {passwordForm.formState.isSubmitting
                  ? t('common.processing')
                  : t('profile.changePassword')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour éditer le compte bancaire */}
      <Dialog open={editBankDialogOpen} onOpenChange={setEditBankDialogOpen}>
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.modifyBankAccount')}</DialogTitle>
            <DialogDescription>{t('profile.bankInfo.title')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='bank-account'>Numéro de compte (IBAN)</Label>
              <Input
                id='bank-account'
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder='FR76 XXXX XXXX XXXX XXXX XXXX'
                className='border-white/10 bg-white/5'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='bank-name'>{t('profile.bankName')}</Label>
              <Input
                id='bank-name'
                placeholder={t('profile.bankName')}
                className='border-white/10 bg-white/5'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditBankDialogOpen(false)}
              className='border-white/10 bg-white/5'
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveBankAccount}
              className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter PayPal */}
      <Dialog open={addPaypalDialogOpen} onOpenChange={setAddPaypalDialogOpen}>
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.addPaypal')}</DialogTitle>
            <DialogDescription>
              {t('profile.addPaypalDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='paypal-email'>
                {t('profile.paypalEmailAddress')}
              </Label>
              <Input
                id='paypal-email'
                type='email'
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder='votre@email.com'
                className='border-white/10 bg-white/5'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAddPaypalDialogOpen(false)}
              className='border-white/10 bg-white/5'
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSavePaypal}
              className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter Crypto */}
      <Dialog open={addCryptoDialogOpen} onOpenChange={setAddCryptoDialogOpen}>
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.addCryptoAddress')}</DialogTitle>
            <DialogDescription>
              Ajoutez votre adresse USDT pour recevoir vos retraits
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='crypto-address'>
                Adresse de portefeuille USDT
              </Label>
              <Input
                id='crypto-address'
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder='0x...'
                className='border-white/10 bg-white/5'
              />
              <p className='text-muted-foreground text-xs'>
                Assurez-vous que l'adresse est correcte. Les transactions sont
                irréversibles.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAddCryptoDialogOpen(false)}
              className='border-white/10 bg-white/5'
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveCrypto}
              className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour voir les sessions actives */}
      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.activeSessions')}</DialogTitle>
            <DialogDescription>
              Gérez vos appareils et sessions connectés
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div
              className={cn(
                'flex items-center justify-between',
                'rounded-xl p-4',
                'border border-white/5 bg-white/5'
              )}
            >
              <div className='flex items-center gap-3'>
                <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
                  <IconDeviceDesktop className='h-4 w-4' />
                </div>
                <div>
                  <p className='font-medium'>{t('profile.currentDevice')}</p>
                  <p className='text-muted-foreground text-sm'>
                    {typeof window !== 'undefined'
                      ? window.navigator.userAgent.split(' ')[0]
                      : 'Navigateur'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Connecté maintenant
                  </p>
                </div>
              </div>
              <RendRBadge variant='success' size='sm'>
                Actif
              </RendRBadge>
            </div>
            <p className='text-muted-foreground text-sm'>
              {t('profile.securitySettings')}{' '}
              {t('profile.accountSecurityDescription2')}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSessionsDialogOpen(false)}
              className='border-white/10 bg-white/5'
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                setSessionsDialogOpen(false);
                handleChangePassword();
              }}
              className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
            >
              Paramètres de sécurité
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation pour supprimer le compte */}
      <AlertDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      >
        <AlertDialogContent className='border-red-500/20 bg-zinc-900'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-400'>
              {t('profile.deleteAccount')}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              {t('modal.confirm.description')}{' '}
              {t('profile.deleteAccountWarning')}
              <ul className='mt-4 list-inside list-disc space-y-2 text-sm'>
                <li>{t('profile.deleteAccountWarning1')}</li>
                <li>{t('profile.deleteAccountWarning2')}</li>
                <li>{t('profile.deleteAccountWarning3')}</li>
                <li>{t('profile.deleteAccountWarning4')}</li>
              </ul>
              <p className='mt-4 font-semibold text-red-400'>
                {t('modal.confirm.title')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-white/10 bg-white/5'>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className='bg-red-500 text-white hover:bg-red-600'
            >
              {t('brokers.deletePermanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
