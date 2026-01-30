import React from 'react';
import { useCurrentFrame, Audio, staticFile } from 'remotion';
import { THEME } from '../constants/theme';

interface TypewriterProps {
  text: string;
  keywords?: string[];
  baseStyle?: React.CSSProperties;
  speed?: number;
  delay?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({ 
  text, 
  keywords = [], 
  baseStyle = {}, 
  speed = 0.7,
  delay = 30 
}) => {
  const frame = useCurrentFrame();
  
  // Frame relative au début de l'écriture
  const typewriterFrame = Math.max(0, frame - delay);
  
  // Nombre de caractères à afficher à la frame actuelle
  const totalCharactersToShow = Math.floor(typewriterFrame * speed);

  const renderStyledText = () => {
    if (frame < delay) return null;

    const fullWords = text.split(' ');
    let charCount = 0;

    return fullWords.map((fullWord, i) => {
      const wordStart = charCount;
      charCount += fullWord.length + 1; 

      if (totalCharactersToShow <= wordStart) return null;

      const partOfWordVisible = fullWord.substring(0, totalCharactersToShow - wordStart);
      
      // Nettoyage pour comparaison avec les keywords
      const cleanFullWord = fullWord.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
      
      const isKeyword = keywords.some(k => {
        const cleanK = k.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
        return cleanFullWord.includes(cleanK) || cleanK.includes(cleanFullWord);
      });

      return (
        <span 
          key={i} 
          style={{ 
            color: isKeyword ? THEME.colors.accent : (baseStyle.color || '#ffffff'),
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
      {/* LOGIQUE AUDIO : Corrigée pour les vitesses variables */}
      {text.split('').map((_, index) => {
        // On déclenche le son dès que la frame actuelle "franchit" le seuil d'apparition du caractère
        const appearanceFrame = Math.floor(index / speed) + delay;
        
        // On ne joue le son que sur la frame exacte du déclenchement
        if (frame === appearanceFrame) {
          return <Audio key={index} src={staticFile('/sfx/typing_key.mp3')} volume={0.2} />;
        }
        return null;
      })}

      {renderStyledText()}
      
      {/* Curseur visible avec animation de clignotement */}
      {frame >= delay && (
        <span style={{ 
          opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
          color: THEME.colors.accent,
          marginLeft: '2px',
          fontWeight: 'bold'
        }}>|</span>
      )}
    </div>
  );
};