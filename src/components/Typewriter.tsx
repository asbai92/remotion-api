import React from 'react';
import { useCurrentFrame, Audio, staticFile } from 'remotion';
import { THEME } from '../constants/theme';

interface TypewriterProps {
  text: string;
  keywords?: string[];
  baseStyle?: React.CSSProperties;
  speed?: number;
  delay?: number; // Nouveau : délai avant le début de l'écriture
}

export const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  keywords = [], 
  baseStyle = {}, 
  speed = 0.7,
  delay = 30 // Par défaut 30 frames (1s à 30fps) pour correspondre à ta transition
}) => {
  const frame = useCurrentFrame();
  
  // On calcule la frame relative au début de l'écriture
  const typewriterFrame = Math.max(0, frame - delay);
  
  const totalCharactersToShow = Math.floor(typewriterFrame * speed);

  const renderStyledText = () => {
    // Si on n'a pas encore atteint le délai, on ne rend aucun mot
    if (frame < delay) return null;

    const fullWords = text.split(' ');
    let charCount = 0;

    return fullWords.map((fullWord, i) => {
      const wordStart = charCount;
      charCount += fullWord.length + 1; 

      if (totalCharactersToShow <= wordStart) return null;

      const partOfWordVisible = fullWord.substring(0, totalCharactersToShow - wordStart);
      const cleanFullWord = fullWord.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
      
      const isKeyword = keywords.some(k => {
        const cleanK = k.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
        return cleanFullWord.includes(cleanK) || cleanK.includes(cleanFullWord);
      });

      return (
        <span 
          key={i} 
          style={{ 
            color: isKeyword ? THEME.colors.accent : (baseStyle.color || THEME.colors.text),
            margin: '0 10px',
            display: 'inline-block',
            whiteSpace: 'pre'
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
      {/* Logique Audio décalée également */}
      {text.split('').map((_, index) => {
        const appearanceFrame = Math.floor(index / speed) + delay;
        if (frame === appearanceFrame) {
          return <Audio key={index} src={staticFile('/sfx/typing_key.mp3')} volume={0.3} />;
        }
        return null;
      })}

      {renderStyledText()}
      
      {/* Curseur visible uniquement après le délai */}
      {frame >= delay && (
        <span style={{ 
          opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
          color: THEME.colors.accent,
          marginLeft: '2px'
        }}>|</span>
      )}
    </div>
  );
};