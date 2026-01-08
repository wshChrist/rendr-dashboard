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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
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
  IconTrendingDown,
  IconCopy,
  IconLock,
  IconDeviceDesktop,
  IconHistory,
  IconSettings,
  IconAlertTriangle,
  IconUpload,
  IconTarget,
  IconTrophy,
  IconActivity,
  IconDatabase,
  IconServer,
  IconChevronRight,
  IconInfoCircle,
  IconPercentage,
  IconCurrencyDollar,
  IconChartLine
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

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

// Interface pour les métriques de trading
interface TradingMetrics {
  winRate: number;
  profitFactor: number;
  totalProfit: number;
  totalLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitLossRatio: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  averageCashbackPerTrade: number;
  cashbackEfficiency: number; // % du profit couvert par le cashback
}

export default function ProfileViewPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createSupabaseClient();
  const router = useRouter();
  const {
    transactions,
    accounts,
    trades,
    isLoading: isLoadingTradingData
  } = useTradingData();

  // Calculer les métriques de trading techniques
  const tradingMetrics = useMemo<TradingMetrics>(() => {
    if (!trades || trades.length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        totalProfit: 0,
        totalLoss: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitLossRatio: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakEvenTrades: 0,
        averageCashbackPerTrade: 0,
        cashbackEfficiency: 0
      };
    }

    const profits = trades.map((trade) => parseFloat(trade.profit || '0'));
    const winningTrades = profits.filter((p) => p > 0);
    const losingTrades = profits.filter((p) => p < 0);
    const breakEvenTrades = profits.filter((p) => p === 0);

    const totalProfit = winningTrades.reduce((sum, p) => sum + p, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, p) => sum + p, 0));
    const averageWin =
      winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss =
      losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const largestWin =
      winningTrades.length > 0 ? Math.max(...winningTrades) : 0;
    const largestLoss =
      losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades)) : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
    const winRate =
      profits.length > 0 ? (winningTrades.length / profits.length) * 100 : 0;
    const profitLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

    const totalCashback = transactions.reduce(
      (sum, t) => sum + t.cashback_amount,
      0
    );
    const averageCashbackPerTrade =
      transactions.length > 0 ? totalCashback / transactions.length : 0;
    const totalNetProfit = totalProfit - totalLoss;
    const cashbackEfficiency =
      totalNetProfit > 0 ? (totalCashback / totalNetProfit) * 100 : 0;

    return {
      winRate,
      profitFactor,
      totalProfit,
      totalLoss,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      profitLossRatio,
      totalTrades: profits.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      averageCashbackPerTrade,
      cashbackEfficiency
    };
  }, [trades, transactions]);

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

    const totalWithdrawn = 0;
    const availableBalance = totalCashback - totalWithdrawn;
    const pendingCashback = 0;

    return {
      total_cashback_earned: totalCashback,
      available_balance: Math.max(0, availableBalance),
      pending_cashback: pendingCashback,
      total_withdrawn: totalWithdrawn,
      total_volume: totalVolume,
      total_trades: totalTrades,
      active_brokers: activeBrokers
    };
  }, [transactions, accounts]);

  const [emailNotifications, setEmailNotifications] = useState(true);
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
      <div className='space-y-6'>
        <Skeleton className='h-32 w-full' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-40' />
          ))}
        </div>
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

  const dateLocale = locale === 'en' ? enUS : fr;
  const memberSince = user?.created_at
    ? format(new Date(user.created_at), 'MMMM yyyy', { locale: dateLocale })
    : t('profile.recently');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('profile.copiedToClipboard'));
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

      let avatarUrl =
        uploadedAvatarUrl ||
        data.avatar ||
        user.user_metadata?.avatar_url ||
        '';

      const fullName = `${data.firstName} ${data.lastName}`.trim();

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

      setUser(updatedUserData.user);
      setAvatarFile(null);
      setAvatarPreview(null);
      setUploadedAvatarUrl(null);

      toast.success(t('profile.profileUpdatedSuccess'));
      setEditProfileDialogOpen(false);
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
      toast.error(t('profile.errors.imageTooLarge'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.errors.mustBeImage'));
      return;
    }

    setAvatarFile(file);
    setIsUploadingAvatar(true);

    try {
      if (!user) {
        toast.error(t('auth.userNotConnected'));
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.warn('Erreur upload avatar:', uploadError);
        const tempUrl = URL.createObjectURL(file);
        setAvatarPreview(tempUrl);
        profileForm.setValue('avatar', tempUrl);
        toast.warning(t('profile.errors.bucketNotExists'));
      } else {
        const {
          data: { publicUrl }
        } = supabase.storage.from('avatars').getPublicUrl(fileName);

        setUploadedAvatarUrl(publicUrl);
        setAvatarPreview(publicUrl);
        profileForm.setValue('avatar', publicUrl);
        toast.success(t('profile.success.imageUploaded'));
      }
    } catch (error: any) {
      console.error("Erreur lors de l'upload de l'avatar:", error);
      toast.error(t('profile.errors.imageUploadError'));
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
    toast.success(t('profile.bankInfoUpdated'));
    setEditBankDialogOpen(false);
  };

  const handleAddPaypal = () => {
    setAddPaypalDialogOpen(true);
  };

  const handleSavePaypal = () => {
    if (!paypalEmail || !paypalEmail.includes('@')) {
      toast.error(t('profile.errors.invalidPaypalEmail'));
      return;
    }
    toast.success(t('profile.success.paypalAdded'));
    setAddPaypalDialogOpen(false);
    setPaypalEmail('');
  };

  const handleAddCrypto = () => {
    setAddCryptoDialogOpen(true);
  };

  const handleSaveCrypto = () => {
    if (!cryptoAddress || cryptoAddress.length < 20) {
      toast.error(t('profile.errors.invalidCryptoAddress'));
      return;
    }
    toast.success(t('profile.success.cryptoAdded'));
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
      toast.success(t('profile.success.passwordChanged'));
      setChangePasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      toast.error(t('profile.errors.passwordChangeError'));
      console.error(error);
    }
  };

  const handleViewSessions = () => {
    setSessionsDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user) {
        toast.error(t('profile.errors.noUserConnected'));
        setDeleteAccountDialogOpen(false);
        return;
      }

      const loadingToast = toast.loading(t('profile.deletingAccount'));

      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(data.message || t('profile.errors.deleteAccountError'));
        setDeleteAccountDialogOpen(false);
        return;
      }

      toast.success(t('profile.success.accountDeleted'));
      setDeleteAccountDialogOpen(false);

      setTimeout(() => {
        router.push('/auth/sign-in');
        router.refresh();
      }, 1000);
    } catch (error) {
      toast.error(t('profile.errors.deleteAccountError'));
      console.error(error);
      setDeleteAccountDialogOpen(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header de profil technique */}
      <Card
        className={cn(
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationFillMode: 'forwards' }}
      >
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
            <div className='flex items-center gap-6'>
              <div className='relative'>
                <Avatar className='h-20 w-20 border-2 border-white/10 md:h-24 md:w-24'>
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.name || 'Avatar'}
                  />
                  <AvatarFallback className='text-foreground bg-white/10 text-xl font-bold md:text-2xl'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='absolute -right-1 -bottom-1 rounded-full border-2 border-zinc-900 bg-[#c5d13f] p-1.5'>
                  <IconShieldCheck className='h-3 w-3 text-zinc-900 md:h-4 md:w-4' />
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <h1 className='text-xl font-bold tracking-tight md:text-2xl'>
                    {user?.user_metadata?.name ||
                      user?.user_metadata?.full_name ||
                      `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() ||
                      t('profile.defaultName')}
                  </h1>
                  <RendRBadge variant='success' dot dotColor='green' size='sm'>
                    {t('profile.verified')}
                  </RendRBadge>
                </div>
                <div className='text-muted-foreground flex flex-wrap items-center gap-4 text-sm'>
                  <span className='flex items-center gap-2'>
                    <IconMail className='h-3.5 w-3.5' />
                    <span>{user?.email}</span>
                  </span>
                  <span className='flex items-center gap-2'>
                    <IconCalendar className='h-3.5 w-3.5' />
                    <span>
                      {t('profile.memberSince')} {memberSince}
                    </span>
                  </span>
                  <span className='flex items-center gap-2'>
                    <IconDatabase className='h-3.5 w-3.5' />
                    <span>
                      {tradingMetrics.totalTrades} {t('profile.trades')}
                    </span>
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <RendRBadge variant='outline' size='sm'>
                    {t('profile.userId')}: {user?.id.slice(0, 8)}...
                  </RendRBadge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0'
                          onClick={() => copyToClipboard(user?.id || '')}
                        >
                          <IconCopy className='h-3 w-3' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('profile.copyUserId')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
        </CardContent>
      </Card>

      {/* Métriques de trading techniques */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Win Rate */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconTarget className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('profile.metrics.winRate')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold'>
              {tradingMetrics.winRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={tradingMetrics.winRate}
              className='h-2 bg-white/5'
            />
            <div className='mt-2 flex items-center justify-between text-xs'>
              <span className='text-muted-foreground/60'>
                {tradingMetrics.winningTrades} {t('profile.metrics.wins')}
              </span>
              <span className='text-muted-foreground/60'>
                {tradingMetrics.losingTrades} {t('profile.metrics.losses')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconChartLine className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('profile.metrics.profitFactor')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold'>
              {tradingMetrics.profitFactor > 0
                ? tradingMetrics.profitFactor.toFixed(2)
                : '0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground/60'>
                  {t('profile.metrics.totalProfit')}
                </span>
                <span className='font-medium text-green-500'>
                  +{tradingMetrics.totalProfit.toFixed(2)}€
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground/60'>
                  {t('profile.metrics.totalLoss')}
                </span>
                <span className='font-medium text-red-500'>
                  -{tradingMetrics.totalLoss.toFixed(2)}€
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Win/Loss */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconTrendingUp className='h-5 w-5' />
              </div>
              <CardDescription className='mb-0'>
                {t('profile.metrics.avgWinLoss')}
              </CardDescription>
            </div>
            <CardTitle className='text-2xl font-bold'>
              {tradingMetrics.profitLossRatio.toFixed(2)}:1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground/60'>
                  {t('profile.metrics.avgWin')}
                </span>
                <span className='font-medium text-green-500'>
                  +{tradingMetrics.averageWin.toFixed(2)}€
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground/60'>
                  {t('profile.metrics.avgLoss')}
                </span>
                <span className='font-medium text-red-500'>
                  -{tradingMetrics.averageLoss.toFixed(2)}€
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cashback Efficiency */}
        <Card
          className={cn(
            'border-[#c5d13f]/20 bg-[#c5d13f]/5',
            'transition-all duration-300',
            'hover:border-[#c5d13f]/40',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className='pb-3'>
            <div className='mb-3 flex items-center gap-2'>
              <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2'>
                <IconCurrencyDollar className='h-5 w-5 text-[#c5d13f]' />
              </div>
              <CardDescription className='mb-0'>
                {t('profile.metrics.cashbackEfficiency')}
              </CardDescription>
            </div>
            <CardTitle className='text-3xl font-bold text-[#c5d13f]'>
              {tradingMetrics.cashbackEfficiency.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(tradingMetrics.cashbackEfficiency, 100)}
              className='h-2 bg-[#c5d13f]/20'
            />
            <p className='text-muted-foreground/60 mt-2 text-xs'>
              {t('profile.metrics.cashbackEfficiencyDescription')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Layout en deux colonnes : Performance & Comptes */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Statistiques de performance détaillées */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                <IconActivity className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>{t('profile.performance.title')}</CardTitle>
                <CardDescription>
                  {t('profile.performance.description')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='rounded-xl border border-white/5 bg-white/5 p-4'>
                <p className='text-muted-foreground mb-1 text-xs'>
                  {t('profile.metrics.largestWin')}
                </p>
                <p className='text-lg font-bold text-green-500'>
                  +{tradingMetrics.largestWin.toFixed(2)}€
                </p>
              </div>
              <div className='rounded-xl border border-white/5 bg-white/5 p-4'>
                <p className='text-muted-foreground mb-1 text-xs'>
                  {t('profile.metrics.largestLoss')}
                </p>
                <p className='text-lg font-bold text-red-500'>
                  -{tradingMetrics.largestLoss.toFixed(2)}€
                </p>
              </div>
            </div>
            <Separator />
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.totalTrades')}
                </span>
                <span className='font-semibold'>
                  {tradingMetrics.totalTrades}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.winningTrades')}
                </span>
                <RendRBadge variant='success' size='sm'>
                  {tradingMetrics.winningTrades}
                </RendRBadge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.losingTrades')}
                </span>
                <RendRBadge variant='outline' size='sm'>
                  {tradingMetrics.losingTrades}
                </RendRBadge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.breakEvenTrades')}
                </span>
                <RendRBadge variant='muted' size='sm'>
                  {tradingMetrics.breakEvenTrades}
                </RendRBadge>
              </div>
            </div>
            <Separator />
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.avgCashbackPerTrade')}
                </span>
                <span className='font-semibold text-[#c5d13f]'>
                  {tradingMetrics.averageCashbackPerTrade.toFixed(2)}€
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('profile.metrics.totalCashback')}
                </span>
                <span className='font-semibold'>
                  <AnimatedNumber
                    value={stats.total_cashback_earned}
                    suffix='€'
                  />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comptes connectés */}
        <Card
          className={cn(
            'transition-all duration-300',
            'hover:border-white/8 hover:bg-zinc-900/50',
            'animate-fade-in-up opacity-0'
          )}
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
                  <IconServer className='h-5 w-5' />
                </div>
                <div>
                  <CardTitle>{t('profile.connectedAccounts.title')}</CardTitle>
                  <CardDescription>
                    {t('profile.connectedAccounts.description')}
                  </CardDescription>
                </div>
              </div>
              <Link href='/dashboard/brokers'>
                <Button variant='outline' size='sm' className='gap-2'>
                  {t('profile.manage')}
                  <IconChevronRight className='h-4 w-4' />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length > 0 ? (
              <div className='space-y-3'>
                {accounts.slice(0, 3).map((account) => (
                  <div
                    key={account.id}
                    className='rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
                          <IconServer className='h-4 w-4' />
                        </div>
                        <div>
                          <p className='font-medium'>{account.broker}</p>
                          <p className='text-muted-foreground text-xs'>
                            {account.login || account.external_account_id}
                          </p>
                        </div>
                      </div>
                      <RendRBadge
                        variant={
                          account.status === 'connected' ? 'success' : 'outline'
                        }
                        size='sm'
                        dot={account.status === 'connected'}
                        dotColor='green'
                      >
                        {account.status === 'connected'
                          ? t('profile.connected')
                          : t('profile.disconnected')}
                      </RendRBadge>
                    </div>
                  </div>
                ))}
                {accounts.length > 3 && (
                  <div className='text-muted-foreground text-center text-sm'>
                    +{accounts.length - 3} {t('profile.moreAccounts')}
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8'>
                <div className='mb-3 rounded-xl border border-white/5 bg-white/5 p-3'>
                  <IconServer className='text-muted-foreground h-6 w-6' />
                </div>
                <p className='text-muted-foreground text-sm'>
                  {t('profile.noAccountsConnected')}
                </p>
                <Link href='/dashboard/brokers'>
                  <Button variant='outline' size='sm' className='mt-4'>
                    {t('profile.connectAccount')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistiques globales */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Link href='/dashboard/withdrawals' className='group'>
          <Card
            className={cn(
              'border-[#c5d13f]/20 bg-[#c5d13f]/5',
              'transition-all duration-300 ease-out',
              'hover:border-[#c5d13f]/40 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='rounded-xl border border-[#c5d13f]/20 bg-[#c5d13f]/10 p-2 transition-all duration-300 group-hover:border-[#c5d13f]/40 group-hover:bg-[#c5d13f]/20'>
                  <IconWallet className='h-5 w-5 text-[#c5d13f]' />
                </div>
                <CardDescription className='mb-0'>
                  {t('stats.availableBalance')}
                </CardDescription>
              </div>
              <CardTitle className='text-2xl font-bold text-[#c5d13f] md:text-3xl'>
                <AnimatedNumber value={stats.available_balance} suffix='€' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('profile.viewWithdrawals')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/transactions' className='group'>
          <Card
            className={cn(
              'transition-all duration-300 ease-out',
              'hover:border-white/10 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300 group-hover:border-white/10 group-hover:bg-white/10'>
                  <IconTrendingUp className='h-5 w-5' />
                </div>
                <CardDescription className='mb-0'>
                  {t('profile.stats.totalCashback')}
                </CardDescription>
              </div>
              <CardTitle className='text-2xl font-bold md:text-3xl'>
                <AnimatedNumber
                  value={stats.total_cashback_earned}
                  suffix='€'
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('profile.viewTransactions')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/transactions' className='group'>
          <Card
            className={cn(
              'transition-all duration-300 ease-out',
              'hover:border-white/10 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300 group-hover:border-white/10 group-hover:bg-white/10'>
                  <IconChartBar className='h-5 w-5' />
                </div>
                <CardDescription className='mb-0'>
                  {t('profile.stats.tradesExecuted')}
                </CardDescription>
              </div>
              <CardTitle className='text-2xl font-bold md:text-3xl'>
                <AnimatedInteger value={stats.total_trades} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('profile.viewTrades')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/dashboard/brokers' className='group'>
          <Card
            className={cn(
              'transition-all duration-300 ease-out',
              'hover:border-white/10 hover:bg-zinc-900/60',
              'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20',
              'cursor-pointer',
              'animate-fade-in-up opacity-0'
            )}
            style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}
          >
            <CardHeader className='pb-3'>
              <div className='mb-3 flex items-center gap-2'>
                <div className='rounded-xl border border-white/5 bg-white/5 p-2 transition-all duration-300 group-hover:border-white/10 group-hover:bg-white/10'>
                  <IconServer className='h-5 w-5' />
                </div>
                <CardDescription className='mb-0'>
                  {t('profile.stats.activeBrokers')}
                </CardDescription>
              </div>
              <CardTitle className='text-2xl font-bold md:text-3xl'>
                <AnimatedInteger value={stats.active_brokers} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground group-hover:text-foreground/80 flex items-center gap-1.5 text-sm transition-colors'>
                {t('profile.manageBrokers')}
                <IconChevronRight className='h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1' />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Section Paramètres - Séparée et clairement identifiée */}
      <Card
        className={cn(
          'border-white/5',
          'transition-all duration-300',
          'hover:border-white/8 hover:bg-zinc-900/50',
          'animate-fade-in-up opacity-0'
        )}
        style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
      >
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl border border-white/5 bg-white/5 p-2'>
              <IconSettings className='h-5 w-5' />
            </div>
            <div>
              <CardTitle>{t('profile.settings.title')}</CardTitle>
              <CardDescription>
                {t('profile.settings.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='payments' className='w-full'>
            <TabsList className='grid w-full grid-cols-3 bg-white/5'>
              <TabsTrigger
                value='payments'
                className='data-[state=active]:bg-white/10'
              >
                <IconWallet className='mr-2 h-4 w-4' />
                {t('profile.tabs.payments')}
              </TabsTrigger>
              <TabsTrigger
                value='notifications'
                className='data-[state=active]:bg-white/10'
              >
                <IconBell className='mr-2 h-4 w-4' />
                {t('profile.tabs.notifications')}
              </TabsTrigger>
              <TabsTrigger
                value='security'
                className='data-[state=active]:bg-white/10'
              >
                <IconLock className='mr-2 h-4 w-4' />
                {t('profile.tabs.security')}
              </TabsTrigger>
            </TabsList>

            {/* Méthodes de paiement */}
            <TabsContent value='payments' className='mt-6 space-y-4'>
              <div className='space-y-3'>
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
                    <RendRBadge variant='accent' dot dotColor='green' size='sm'>
                      {t('profile.withdrawalMethods.default')}
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
                        {t('profile.withdrawalMethods.notConfigured')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-white/10 bg-white/5'
                    onClick={handleAddPaypal}
                  >
                    {t('common.actions.add')}
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
                  <div className='flex items-center gap-4'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5'>
                      <IconCurrencyBitcoin className='h-6 w-6' />
                    </div>
                    <div>
                      <p className='font-medium'>Crypto (USDT)</p>
                      <p className='text-muted-foreground text-sm'>
                        {t('profile.withdrawalMethods.notConfigured')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-white/10 bg-white/5'
                    onClick={handleAddCrypto}
                  >
                    {t('profile.add')}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value='notifications' className='mt-6 space-y-4'>
              <div className='space-y-4'>
                <div
                  className={cn(
                    'flex items-center justify-between',
                    'rounded-xl p-4',
                    'border border-white/5 bg-white/5'
                  )}
                >
                  <div className='space-y-0.5'>
                    <Label
                      htmlFor='email-notifications'
                      className='font-medium'
                    >
                      {t('profile.notifications.email')}
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
                    'border border-white/5 bg-white/5'
                  )}
                >
                  <div className='space-y-0.5'>
                    <Label htmlFor='weekly-report' className='font-medium'>
                      {t('profile.notifications.weeklyReport')}
                    </Label>
                    <p className='text-muted-foreground text-sm'>
                      {t('profile.notifications.weeklyReportDescription')}
                    </p>
                  </div>
                  <Switch
                    id='weekly-report'
                    checked={weeklyReport}
                    onCheckedChange={setWeeklyReport}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sécurité */}
            <TabsContent value='security' className='mt-6 space-y-4'>
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
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
                      <IconLock className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='font-medium'>
                        {t('profile.changePassword')}
                      </p>
                      <p className='text-muted-foreground text-sm'>
                        {t('profile.password.title')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-white/10 bg-white/5'
                    onClick={handleChangePassword}
                  >
                    {t('profile.change')}
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
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border border-white/5 bg-white/5 p-2'>
                      <IconDeviceDesktop className='h-4 w-4' />
                    </div>
                    <div>
                      <p className='font-medium'>
                        {t('profile.activeSessions')}
                      </p>
                      <p className='text-muted-foreground text-sm'>
                        {t('profile.security.devicesConnected', { count: 1 })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='hover:bg-white/5'
                    onClick={handleViewSessions}
                  >
                    {t('profile.security.viewAll')}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Zone dangereuse */}
              <div
                className={cn(
                  'rounded-xl p-4',
                  'border border-red-500/20 bg-red-500/5'
                )}
              >
                <div className='mb-4 flex items-center gap-2'>
                  <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-2'>
                    <IconAlertTriangle className='h-4 w-4 text-red-400' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-red-400'>
                      {t('profile.security.dangerZone')}
                    </h3>
                    <p className='text-muted-foreground text-xs'>
                      {t('profile.security.dangerZoneDescription')}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between',
                    'rounded-lg p-3',
                    'border border-red-500/10 bg-red-500/5',
                    'transition-all duration-200',
                    'hover:bg-red-500/10'
                  )}
                >
                  <div>
                    <p className='text-sm font-medium'>
                      {t('profile.deleteAccount')}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {t('profile.security.deleteAccountDescription')}
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    onClick={() => setDeleteAccountDialogOpen(true)}
                  >
                    {t('profile.security.delete')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                  {t('profile.avatar.clickToChange')}
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
                <Label htmlFor='email'>{t('profile.email')}</Label>
                <Input
                  id='email'
                  type='email'
                  {...profileForm.register('email')}
                  className='border-white/10 bg-white/5'
                  placeholder={t('profile.emailPlaceholder')}
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
              <Label htmlFor='bank-account'>
                {t('profile.bankAccountNumber')}
              </Label>
              <Input
                id='bank-account'
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder={t('withdrawals.ibanPlaceholder')}
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
                placeholder={t('profile.emailPlaceholder')}
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
              {t('profile.add')}
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
              {t('profile.addCryptoDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='crypto-address'>
                {t('profile.cryptoWalletAddress')}
              </Label>
              <Input
                id='crypto-address'
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder={t('withdrawals.cryptoAddressPlaceholder')}
                className='border-white/10 bg-white/5'
              />
              <p className='text-muted-foreground text-xs'>
                {t('profile.cryptoAddressWarning')}
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
              {t('profile.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour voir les sessions actives */}
      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className='border-white/5 bg-zinc-900'>
          <DialogHeader>
            <DialogTitle>{t('profile.activeSessions')}</DialogTitle>
            <DialogDescription>{t('profile.manageSessions')}</DialogDescription>
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
                      : t('profile.browser')}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {t('profile.connectedNow')}
                  </p>
                </div>
              </div>
              <RendRBadge variant='success' size='sm'>
                {t('profile.active')}
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
              {t('profile.close')}
            </Button>
            <Button
              onClick={() => {
                setSessionsDialogOpen(false);
                handleChangePassword();
              }}
              className='bg-[#c5d13f] text-zinc-900 hover:bg-[#c5d13f]/90'
            >
              {t('profile.securitySettingsButton')}
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
