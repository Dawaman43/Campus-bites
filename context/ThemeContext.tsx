
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkTheme: false,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const theme = await AsyncStorage.getItem('theme');
        console.log('Loaded theme from AsyncStorage:', theme);
        if (theme === 'dark' || theme === 'light') {
          setIsDarkTheme(theme === 'dark');
        } else {
          console.log('No valid theme found, defaulting to light');
          setIsDarkTheme(false);
          await AsyncStorage.setItem('theme', 'light');
        }
      } catch (error) {
        console.error('Error loading theme from AsyncStorage:', error);
        setIsDarkTheme(false);
        AsyncStorage.setItem('theme', 'light').catch((err) =>
          console.error('Failed to set default theme:', err)
        );
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => {
      const newTheme = !prev;
      console.log('Toggling theme. Previous:', prev, 'New:', newTheme);
      AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light')
        .then(() => {
          console.log('Theme saved to AsyncStorage:', newTheme ? 'dark' : 'light');
          AsyncStorage.getItem('theme').then((stored) =>
            console.log('Verified AsyncStorage theme:', stored)
          );
        })
        .catch((error) => console.error('Failed to save theme to AsyncStorage:', error));
      return newTheme;
    });
  };

  console.log('Rendering ThemeProvider with isDarkTheme:', isDarkTheme);

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
