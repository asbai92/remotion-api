import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { THEME } from '../constants/theme';

interface GridProps {
  content: {
    titre?: string;
    medias?: string[];
    points?: string[];
  };
}

export const Grid: React.FC<GridProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const items = content.medias || [];

  const entranceDelay = 20;
  const stagger = 12;

  const [lotties, setLotties] = useState<{[key: number]: LottieAnimationData | null}>({});

  useEffect(() => {
    items.forEach((path, i) => {
      if (!path) return;
      const isLottie = !path.toLowerCase().endsWith('.mp4') && !path.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);
      if (isLottie) {
        const fileName = path.endsWith('.json') ? path : `${path}.json`;
        fetch(staticFile(`/lotties/${fileName}`))
          .then(res => res.json())
          .then(data => setLotties(prev => ({ ...prev, [i]: data })))
          .catch(e => console.error("Erreur Lottie Grid:", e));
      }
    });
  }, [items]);

  const renderItemMedia = (src: string, index: number) => {
    const finalUrl = src.startsWith('http') ? src : staticFile(src);
    const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
    const pathLower = src.toLowerCase();
    
    if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
    if (lotties[index]) return <Lottie {...({ animationData: lotties[index], frame: Math.max(0, frame - (entranceDelay + (index * stagger))), style: { width: '80%', height: '80%', objectFit: 'contain' } } as any)} />;
    if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/) || src.startsWith('http')) return <Img src={finalUrl} style={style} />;
    return null;
  };

  const titleEntrance = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  // LOGIQUE DE GRILLE AMÉLIORÉE
  const getGridConfig = () => {
    const count = items.length;
    if (count <= 3) return `repeat(${count}, 1fr)`; 
    if (count === 4) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)'; // Pour 5, 6 éléments ou plus : 3 colonnes
  };

  return (
    <AbsoluteFill style={{ padding: '40px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      {content.titre && (
        <div style={{
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [-20, 0])}px)`,
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.title * 0.7,
          fontWeight: 900,
          color: THEME.colors.accent,
          textAlign: 'center',
          marginBottom: '30px',
          textTransform: 'uppercase'
        }}>
          {content.titre}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: getGridConfig(),
        gap: items.length > 4 ? '25px' : '40px', // On réduit l'espace si beaucoup d'éléments
        width: '100%',
        maxWidth: '1200px', 
        margin: '0 auto',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {items.map((item, i) => {
          const delay = entranceDelay + (i * stagger);
          const spr = spring({ frame: frame - delay, fps, config: { damping: 12 } });
          const direction = i % 2 === 0 ? -150 : 150;
          const translateY = interpolate(spr, [0, 1], [direction, 0]);

          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: spr,
              transform: `translateY(${translateY}px)`,
              width: '100%',
              // AJUSTEMENT DYNAMIQUE DU MAX-WIDTH
              maxWidth: items.length > 4 ? '320px' : (items.length <= 2 ? '450px' : '380px')
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1/1',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `3px solid ${THEME.colors.accent}`,
                borderRadius: items.length > 4 ? '15px' : '25px', // Coins plus doux si petits
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              }}>
                {renderItemMedia(item, i)}
              </div>

              {content.points && content.points[i] && (
                <div style={{
                  marginTop: '10px',
                  color: 'white',
                  fontFamily: THEME.typography.fontFamily,
                  fontSize: items.length > 4 ? '18px' : '24px', // Texte plus petit si 6 éléments
                  fontWeight: 800,
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}>
                  {content.points[i]}
                </div>
              )}

              <Sequence from={delay}>
                <Audio src={staticFile('/sfx/pop.mp3')} volume={0.4} />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};