// theme.ts
import { staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont();

// 1. Définition d'une interface stricte pour le Thème
export interface ThemeConfig {
  assets: {
    backgroundVideo: string | null;
    backgroundMusic: string | null; // ✅ On autorise explicitement null ou string
  };
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: { hero: number; title: number; body: number };
  };
  audio: { musicVolume: number; sfxVolume: number };
}

// 2. Application du type au dictionnaire de thèmes
export const THEMES_LIST: Record<string, ThemeConfig> = {
  youtube_videos: {
    assets: {
      backgroundVideo: '/branding/dark-grid.mp4',
      backgroundMusic: '/branding/motivational-music1.mp3',
    },
    colors: {
      background: '#000000',
      text: '#FFFFFF',
      accent: '#F3C80D',
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: { hero: 120, title: 80, body: 40 }
    },
    audio: { musicVolume: 0.1, sfxVolume: 0.6 }
  },
  online_course: {
    assets: {
      backgroundVideo: '/branding/schoolboard.jpg', 
      backgroundMusic: null, // ✅ Plus d'erreur ici grâce à l'interface
    },
    colors: {
      background: '#001529',
      text: '#e6f7ff',
      accent: '#ff9318',
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: { hero: 110, title: 75, body: 35 }
    },
    audio: { musicVolume: 0.15, sfxVolume: 0.5 }
  },
  minimal_flat: {
    assets: {
      backgroundVideo: null, 
      backgroundMusic: '', 
    },
    colors: {
      background: '#2ecc71',
      text: '#ffffff',
      accent: '#27ae60',
    },
    typography: {
      fontFamily: fontFamily,
      fontSize: { hero: 100, title: 70, body: 30 }
    },
    audio: { musicVolume: 0, sfxVolume: 0.4 }
  }
};

export const getTheme = (themeName: string): ThemeConfig => {
  return THEMES_LIST[themeName] || THEMES_LIST.youtube_videos;
};