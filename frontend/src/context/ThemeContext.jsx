import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_COLORS } from '../theme/colors';

const ThemeContext = createContext(null);

export const COLOR_PRESETS = [
  { id: 'teal_mint', name: 'Teal & Mint', primaryColor: '#00695C', accentColor: '#4DB6AC', badgeBg: 'bg-teal-600', desc: 'Fresh, organic supermarket brand theme' },
  { id: 'emerald', name: 'Emerald Fresh', primaryColor: '#009688', accentColor: '#4DB6AC', badgeBg: 'bg-teal-500', desc: 'Clean modern grocery green' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('tm_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [colorTheme, setColorThemeState] = useState(() => {
    return 'teal_mint';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tm_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', 'teal_mint');
    localStorage.setItem('tm_color_theme', 'teal_mint');
  }, [colorTheme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (newColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme, 
        setTheme, 
        isDark: theme === 'dark',
        colorTheme,
        setColorTheme,
        colorPresets: COLOR_PRESETS,
        colors: THEME_COLORS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
