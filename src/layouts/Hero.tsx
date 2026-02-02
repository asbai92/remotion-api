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
  
  const startDelay = 20;
  const writingEndFrame = totalFrames * 0.8;
  const availableFrames = writingEndFrame - startDelay;
  
  const idealSpeed = text.length / availableFrames;

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
        // Utilisation des propriétés du thème pour le style
        baseStyle={{
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.title,
          textAlign: 'center',
          fontWeight: 900,
          lineHeight: 1.1,
          textTransform: 'uppercase',
          color: theme.colors.text, // Couleur de texte dynamique
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
        // Optionnel : si ton Typewriter supporte un style pour les mots-clés
        highlightStyle={{
          color: theme.colors.accent,
        }}
      />
    </AbsoluteFill>
  );
};