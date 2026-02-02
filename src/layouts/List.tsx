import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Audio, staticFile } from 'remotion';
// Import du hook
import { useTheme } from '../context/ThemeContext';

interface ListProps {
  content: {
    titre?: string;
    points?: string[];
  };
  durationInSeconds?: number;
}

export const List: React.FC<ListProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme(); // Accès au thème
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const points = content.points || [];

  const entranceDelay = 15;
  const totalFrames = durationInSeconds * fps;

  const lastPointTargetFrame = totalFrames * 0.8;
  const availableFramesForPoints = lastPointTargetFrame - (entranceDelay + 20);
  
  const stagger = points.length > 1 
    ? Math.max(10, Math.floor(availableFramesForPoints / (points.length - 1)))
    : 15;

  const titleEntrance = spring({
    frame: frame - entranceDelay,
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent', 
      padding: '100px 100px 60px 100px', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* TITRE */}
      {content.titre && (
        <>
          <Sequence from={entranceDelay}>
            <Audio src={staticFile('/sfx/pop.mp3')} volume={theme.audio.sfxVolume} />
          </Sequence>
          <div style={{
            opacity: titleEntrance,
            transform: `translateY(${interpolate(titleEntrance, [0, 1], [-40, 0])}px)`,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title * 0.8,
            fontWeight: 900,
            color: theme.colors.accent, // Couleur d'accent du thème
            textTransform: 'uppercase',
            textAlign: 'center',
            textShadow: '0px 5px 15px rgba(0,0,0,0.7)',
            zIndex: 10,
            marginBottom: '40px'
          }}>
            {content.titre}
          </div>
        </>
      )}

      {/* CONTENEUR DE LISTE */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-evenly', 
        marginTop: '20px', 
      }}>
        {points.map((point, i) => {
          const pointDelay = entranceDelay + 20 + (i * stagger);
          
          const spr = spring({
            frame: frame - pointDelay,
            fps,
            config: { stiffness: 100, damping: 12 }
          });

          const translateX = interpolate(spr, [0, 1], [-60, 0]);
          const scale = interpolate(spr, [0, 1], [0.8, 1]);

          return (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: spr,
              transform: `translateX(${translateX}px) scale(${scale})`,
              marginBottom: '15px'
            }}>
              {/* Puce colorée dynamique */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: `4px solid ${theme.colors.accent}`, 
                marginRight: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: theme.colors.accent,
                fontSize: '32px',
                fontWeight: 'bold',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
                textShadow: `0px 2px 10px ${theme.colors.accent}44` // Petit glow de la couleur d'accent
              }}>
                ✓
              </div>

              <div style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: points.length > 5 ? '32px' : '42px', 
                color: theme.colors.text, // Couleur de texte du thème
                fontWeight: 800,
                textShadow: '0px 3px 20px rgba(0,0,0,0.9)',
                lineHeight: 1.2,
                flex: 1
              }}>
                {point}
              </div>

              {/* SFX synchronisé */}
              <Sequence from={pointDelay}>
                <Audio 
                  src={staticFile('/sfx/pop.mp3')} 
                  volume={theme.audio.sfxVolume * 0.8} 
                />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};