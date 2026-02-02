import React, { createContext, useContext } from 'react';
import { THEMES_LIST } from '../constants/theme';

// On utilise le type d'un des thèmes par défaut
type ThemeType = typeof THEMES_LIST.youtube_videos;

const ThemeContext = createContext<ThemeType | null>(null);

export const ThemeProvider: React.FC<{ theme: ThemeType; children: React.ReactNode }> = ({ theme, children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider");
  }
  return context;
};