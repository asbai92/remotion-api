import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEME } from '../constants/theme';

interface HeroProps {
  text: string;
  keywords?: string[];
}

export const Hero: React.FC<HeroProps> = ({ text, keywords = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation d'entrée (zoom + opacité)
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  // Fonction pour styliser les mots-clés
  const renderStyledText = () => {
    return text.split(' ').map((word, i) => {
      const isKeyword = keywords.some(k => word.toUpperCase().includes(k.toUpperCase()));
      return (
        <span 
          key={i} 
          style={{ 
            color: isKeyword ? THEME.colors.accent : THEME.colors.text,
            margin: '0 15px'
          }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 50px',
      transform: `scale(${0.8 + 0.2 * entrance})`,
      opacity: entrance,
    }}>
      <h1 style={{
        fontFamily: THEME.typography.fontFamily,
        fontSize: THEME.typography.fontSize.hero,
        textAlign: 'center',
        fontWeight: 900,
        lineHeight: 1.1,
        textTransform: 'uppercase',
      }}>
        {renderStyledText()}
      </h1>
    </AbsoluteFill>
  );
};