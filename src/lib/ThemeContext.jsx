import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('gitnotes_theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gitnotes_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
