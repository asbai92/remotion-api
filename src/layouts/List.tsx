import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate, Sequence, Audio, staticFile } from 'remotion';
import { THEME } from '../constants/theme';

interface ListProps {
  content: {
    titre?: string;
    points?: string[];
  };
}

export const List: React.FC<ListProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const points = content.points || [];

  const entranceDelay = 20;
  const stagger = 15;

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
            fontSize: THEME.typography.fontSize.title * 0.9,
            fontWeight: 900,
            color: THEME.colors.accent,
            textTransform: 'uppercase',
            textAlign: 'center',
            textShadow: '0px 5px 15px rgba(0,0,0,0.7)',
            zIndex: 10
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
          const pointDelay = entranceDelay + 20 + (i * stagger);
          const spr = spring({
            frame: frame - pointDelay,
            fps,
            config: { stiffness: 100, damping: 12 }
          });

          return (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              opacity: spr,
              transform: `translateX(${interpolate(spr, [0, 1], [-50, 0])}px)`
            }}>
              {/* Puce colorée */}
              <div style={{
                width: '65px',
                height: '65px',
                borderRadius: '50%',
                border: `4px solid ${THEME.colors.accent}`, 
                marginRight: '45px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: THEME.colors.accent,
                fontSize: '35px',
                fontWeight: 'bold',
                flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.2)',
                textShadow: '0px 2px 10px rgba(0,0,0,0.5)'
              }}>
                ✓
              </div>

              <div style={{
                fontFamily: THEME.typography.fontFamily,
                fontSize: THEME.typography.fontSize.body * 1.5,
                color: 'white',
                fontWeight: 800,
                textShadow: '0px 3px 20px rgba(0,0,0,0.9)',
                lineHeight: 1.1,
                flex: 1
              }}>
                {point}
              </div>

              <Sequence from={pointDelay}>
                <Audio src={staticFile('/sfx/pop.mp3')} volume={0.5} />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};