'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const LOCALES = [
  {
    name: 'Français',
    value: 'fr',
    flag: '🇫🇷'
  },
  {
    name: 'English',
    value: 'en',
    flag: '🇬🇧'
  }
];

export function LocaleSelector() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const currentLocale = LOCALES.find((loc) => loc.value === locale);

  return (
    <div className='flex items-center gap-2' suppressHydrationWarning>
      <Label htmlFor='locale-selector' className='sr-only'>
        {t('common.chooseLanguage')}
      </Label>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          id='locale-selector'
          className='justify-start *:data-[slot=select-value]:w-12'
        >
          <span className='text-muted-foreground hidden sm:block'>
            {t('common.chooseLanguage')} :
          </span>
          <SelectValue>
            {currentLocale && (
              <div className='flex items-center gap-2'>
                <span>{currentLocale.flag}</span>
                <span className='hidden sm:inline'>{currentLocale.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align='end'>
          {LOCALES.map((loc) => (
            <SelectItem key={loc.value} value={loc.value}>
              <div className='flex items-center gap-2'>
                <span>{loc.flag}</span>
                <span>{loc.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
