import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
// Import du hook pour le thème
import { useTheme } from '../context/ThemeContext';
import { Typewriter } from '../components/Typewriter';

interface HeroProps {
  content: {
    text: string;
    keywords?: string[];
  };
  durationInSeconds?: number;
}

export const Hero: React.FC<HeroProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme(); // Accès au thème dynamique
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const text = content?.text || "";
  const keywords = content?.keywords || [];
  const totalFrames = durationInSeconds * fps;
  
  // --- CONFIGURATION DU TIMING ---
  
  // 1. Délai avant le début de l'écriture (frames)
  const startDelay = 15; 
  
  // 2. Temps de pause à la fin pour la lecture (ex: 2 secondes)
  const endPauseDurationInFrames = fps * 2; 
  
  // 3. Calcul de l'espace restant pour l'animation d'écriture
  // On s'assure d'avoir au moins 1 frame pour éviter les erreurs mathématiques
  const writingDurationInFrames = Math.max(1, totalFrames - startDelay - endPauseDurationInFrames);
  
  // 4. Calcul de la vitesse idéale (caractères par frame)
  // Vitesse = (Nombre total de caractères) / (Nombre de frames allouées)
  const idealSpeed = text.length / writingDurationInFrames;

  // Animation de zoom progressif sur toute la durée
  const scale = interpolate(
    frame,
    [0, totalFrames],
    [1, 1.05],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 80px',
      transform: `scale(${scale})`,
    }}>
      <Typewriter 
        text={text} 
        keywords={keywords}
        speed={idealSpeed} 
        delay={startDelay}
        // Style basé sur le thème
        baseStyle={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.title,
          textAlign: 'center',
          fontWeight: 900,
          lineHeight: 1.1,
          textTransform: 'uppercase',
          color: theme.colors.text, 
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
        highlightStyle={{
          color: theme.colors.accent,
        }}
      />
    </AbsoluteFill>
  );
};