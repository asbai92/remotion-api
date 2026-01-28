import { continueRender, delayRender } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter'; // Police par défaut

// On prépare le chargement de la police
const { fontFamily } = loadFont();

export const THEME = {
  colors: {
    background: '#000000',
    text: '#FFFFFF', // Couleur principale
    accent: '#F3C80D', // Couleur pour les mots importants
  },
  typography: {
    fontFamily: fontFamily,
    fontSize: {
      hero: 120,
      title: 80,
      body: 40,
    }
  }
};

// Fonction pour charger dynamiquement une police si besoin (optionnel plus tard)
export const getFontFamily = () => fontFamily;