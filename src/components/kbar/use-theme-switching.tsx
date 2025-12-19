import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeAction = [
    {
      id: 'toggleTheme',
      name: 'Changer le thème',
      shortcut: ['t', 't'],
      section: 'Thème',
      perform: toggleTheme
    },
    {
      id: 'setLightTheme',
      name: 'Mode clair',
      section: 'Thème',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Mode sombre',
      section: 'Thème',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeAction, [theme]);
};

export default useThemeSwitching;
