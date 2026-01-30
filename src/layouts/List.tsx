import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Audio, staticFile } from 'remotion';
import { THEME } from '../constants/theme';

interface ListProps {
  content: {
    titre?: string;
    points?: string[];
  };
  durationInSeconds?: number;
}

export const List: React.FC<ListProps> = ({ content, durationInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const points = content.points || [];

  const entranceDelay = 15; // Un peu plus rapide au début
  const totalFrames = durationInSeconds * fps;

  // CALCUL DU STAGGER DYNAMIQUE
  // On veut que le dernier point apparaisse au plus tard à 80% de la vidéo
  const lastPointTargetFrame = totalFrames * 0.8;
  const availableFramesForPoints = lastPointTargetFrame - (entranceDelay + 20);
  
  // On calcule l'écart entre chaque point (minimum 10 frames pour garder de la lisibilité)
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
            <Audio src={staticFile('/sfx/pop.mp3')} volume={0.6} />
          </Sequence>
          <div style={{
            opacity: titleEntrance,
            transform: `translateY(${interpolate(titleEntrance, [0, 1], [-40, 0])}px)`,
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.fontSize.title * 0.8,
            fontWeight: 900,
            color: THEME.colors.accent,
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

      {/* CONTENEUR DE LISTE AUTO-AJUSTABLE */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-evenly', 
        marginTop: '20px', 
      }}>
        {points.map((point, i) => {
          // Chaque point a son propre délai basé sur le stagger calculé
          const pointDelay = entranceDelay + 20 + (i * stagger);
          
          const spr = spring({
            frame: frame - pointDelay,
            fps,
            config: { stiffness: 100, damping: 12 }
          });

          // Petit effet de balancement latéral
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
              {/* Puce colorée */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: `4px solid ${THEME.colors.accent}`, 
                marginRight: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: THEME.colors.accent,
                fontSize: '32px',
                fontWeight: 'bold',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                boxShadow: '0px 10px 25px rgba(0,0,0,0.3)',
                textShadow: '0px 2px 10px rgba(0,0,0,0.5)'
              }}>
                ✓
              </div>

              <div style={{
                fontFamily: THEME.typography.fontFamily,
                fontSize: points.length > 5 ? '32px' : '42px', // Taille adaptative selon le nombre de points
                color: 'white',
                fontWeight: 800,
                textShadow: '0px 3px 20px rgba(0,0,0,0.9)',
                lineHeight: 1.2,
                flex: 1
              }}>
                {point}
              </div>

              {/* SFX synchronisé sur l'apparition du point */}
              <Sequence from={pointDelay}>
                <Audio src={staticFile('/sfx/pop.mp3')} volume={0.4} />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};