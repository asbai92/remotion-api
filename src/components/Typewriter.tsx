import React from 'react';
import { useCurrentFrame, Audio, staticFile, Sequence } from 'remotion';
import { useTheme } from '../context/ThemeContext';

interface TypewriterProps {
  text: string;
  keywords?: string[];
  baseStyle?: React.CSSProperties;
  highlightStyle?: React.CSSProperties;
  speed?: number; // Vitesse de base
  delay?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  keywords = [], 
  baseStyle = {}, 
  highlightStyle = {},
  speed = 0.7,
  delay = 30 
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();

  // --- LOGIQUE DE TIMING ORGANIQUE ---
  // On calcule l'apparition de chaque caractère avec un léger "jitter" (variation)
  const characters = text.split('');
  const charTimings = characters.reduce((acc, char, i) => {
    const prevTimestamp = i === 0 ? delay : acc[i - 1];
    // Ajoute une variation aléatoire basée sur l'index (déterministe pour Remotion)
    const jitter = (Math.sin(i * 13.5) + 1) * 0.5; // Oscille entre 0 et 1
    const interval = (1 / speed) + (jitter * 2); // Ajoute entre 0 et 2 frames d'aléa
    acc.push(prevTimestamp + interval);
    return acc;
  }, [] as number[]);

  const totalCharactersToShow = charTimings.filter(t => t <= frame).length;

  const renderStyledText = () => {
    const fullWords = text.split(' ');
    let globalCharIdx = 0;

    return fullWords.map((fullWord, i) => {
      const wordStartIdx = globalCharIdx;
      const wordEndIdx = globalCharIdx + fullWord.length;
      
      // On passe au mot suivant pour le prochain tour de boucle
      globalCharIdx += fullWord.length + 1; 

      if (totalCharactersToShow <= wordStartIdx) return null;

      const visibleInWord = Math.min(fullWord.length, totalCharactersToShow - wordStartIdx);
      const partOfWordVisible = fullWord.substring(0, visibleInWord);
      
      const cleanFullWord = fullWord.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
      const isKeyword = keywords.some(k => {
        const cleanK = k.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
        return cleanFullWord.includes(cleanK) || cleanK.includes(cleanFullWord);
      });

      return (
        <span 
          key={i} 
          style={{ 
            color: isKeyword ? theme.colors.accent : (baseStyle.color || theme.colors.text),
            margin: '0 8px',
            display: 'inline-block',
            whiteSpace: 'pre',
            ...isKeyword ? highlightStyle : {} 
          }}
        >
          {partOfWordVisible}
        </span>
      );
    });
  };

  return (
    <div style={{ 
      ...baseStyle, 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: baseStyle.textAlign === 'left' ? 'flex-start' : 'center' 
    }}>
      {/* AUDIO AVEC TIMING ORGANIQUE */}
      {characters.map((char, index) => {
        if (char === ' ') return null;
        
        const startFrame = Math.floor(charTimings[index]);

        return (
          <Sequence 
            key={index} 
            from={startFrame} 
            durationInFrames={5} 
            layout="none"
          >
            <Audio 
              src={staticFile('/sfx/typing_key.mp3')} 
              volume={theme.audio.sfxVolume * 0.4}
              // Pitch variable pour éviter l'effet robot
              playbackRate={0.85 + (Math.sin(index) * 0.15)} 
            />
          </Sequence>
        );
      })}

      {renderStyledText()}
      
      {/* Curseur clignotant */}
      {frame >= delay && totalCharactersToShow < text.length && (
        <span style={{ 
          opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
          color: theme.colors.accent,
          marginLeft: '2px',
          fontWeight: 'bold'
        }}>|</span>
      )}
    </div>
  );
};