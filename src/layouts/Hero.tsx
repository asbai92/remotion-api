import React from 'react';
import { AbsoluteFill } from 'remotion';
import { THEME } from '../constants/theme';
import { Typewriter } from '../components/Typewriter';

interface HeroProps {
  text: string;
  keywords?: string[];
}

export const Hero: React.FC<HeroProps> = ({ text, keywords = [] }) => {
  // On enlève useCurrentFrame, useVideoConfig et spring
  // car Typewriter gère sa propre timeline interne.

  return (
    <AbsoluteFill style={{
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 50px',
      // On enlève aussi les transforms liés à 'entrance'
    }}>
      <Typewriter 
        text={text} 
        keywords={keywords}
        baseStyle={{
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.title,
          textAlign: 'center',
          fontWeight: 900,
          lineHeight: 1.1,
          textTransform: 'uppercase',
        }}
      />
    </AbsoluteFill>
  );
};