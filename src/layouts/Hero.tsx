import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { THEME } from '../constants/theme';
import { Typewriter } from '../components/Typewriter';

interface HeroProps {
  content: {
    text: string;
    keywords?: string[];
  };
  durationInSeconds?: number;
}

export const Hero: React.FC<HeroProps> = ({ content, durationInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const text = content?.text || "";
  const keywords = content?.keywords || [];
  const totalFrames = durationInSeconds * fps;
  
  // CONFIGURATION DYNAMIQUE
  const startDelay = 20; // On commence un peu plus tôt (frame 20)
  const writingEndFrame = totalFrames * 0.8; // On veut avoir fini d'écrire à 80% du temps
  const availableFrames = writingEndFrame - startDelay;
  
  // Calcul de la vitesse : caractères / frames disponibles
  // Si le texte fait 50 caractères et on a 100 frames, speed = 0.5
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
        speed={idealSpeed} // On injecte la vitesse calculée
        delay={startDelay} // On injecte le délai
        baseStyle={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.title,
          textAlign: 'center',
          fontWeight: 900,
          lineHeight: 1.1,
          textTransform: 'uppercase',
          color: 'white',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      />
    </AbsoluteFill>
  );
};