import React from 'react';
import { useCurrentFrame, Audio, staticFile, Sequence } from 'remotion'; // Ajout de Sequence
import { useTheme } from '../context/ThemeContext';

interface TypewriterProps {
  text: string;
  keywords?: string[];
  baseStyle?: React.CSSProperties;
  highlightStyle?: React.CSSProperties;
  speed?: number;
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
  
  const typewriterFrame = Math.max(0, frame - delay);
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
            margin: '0 10px',
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
      {/* LOGIQUE AUDIO CORRIGÉE AVEC SEQUENCE */}
      {text.split('').map((_, index) => {
        const startFrame = Math.floor(index / speed) + delay;
        
        return (
          <Sequence key={index} from={startFrame}>
            <Audio 
              src={staticFile('/sfx/typing_key.mp3')} 
              volume={theme.audio.sfxVolume * 0.5}
            />
          </Sequence>
        );
      })}

      {renderStyledText()}
      
      {frame >= delay && (
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