import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeAction = [
    {
      id: 'toggleTheme',
      name: t('theme.changeTheme'),
      shortcut: ['t', 't'],
      section: t('theme.theme'),
      perform: toggleTheme
    },
    {
      id: 'setLightTheme',
      name: t('theme.lightMode'),
      section: t('theme.theme'),
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: t('theme.darkMode'),
      section: t('theme.theme'),
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeAction, [theme, t]);
};

export default useThemeSwitching;
