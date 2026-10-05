import { useState, useEffect } from 'react';
import { getStoredTheme, saveStoredTheme } from '../utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
