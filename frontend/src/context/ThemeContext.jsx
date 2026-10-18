import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    }
    return 'dark';
  });

  const isDark = theme === 'dark';

  const applyThemeToDOM = useCallback((currentTheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const rootDiv = document.getElementById('root');

    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (rootDiv) {
        rootDiv.classList.add('dark');
        rootDiv.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (rootDiv) {
        rootDiv.classList.remove('dark');
        rootDiv.classList.add('light');
      }
    }
  }, []);

  // المزامنة الفورية مع DOM و localStorage
  useEffect(() => {
    applyThemeToDOM(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', theme);
    }
  }, [theme, applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  const value = {
    theme,
    isDark,
    toggleTheme,
    setTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
