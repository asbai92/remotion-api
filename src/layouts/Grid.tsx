import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';

// Import du hook pour le thème global
import { useTheme } from '../context/ThemeContext';

interface GridProps {
  content: {
    titre?: string;
    medias?: string[];
    points?: string[];
  };
  durationInSeconds?: number;
}

export const Grid: React.FC<GridProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme(); // Accès au thème global
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const items = content.medias || [];

  const entranceDelay = 15;
  const totalFrames = durationInSeconds * fps;
  const stagger = Math.min(12, Math.floor((totalFrames * 0.8 - entranceDelay) / items.length));

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

  const getGridConfig = () => {
    const count = items.length;
    if (count <= 3) return `repeat(${count}, 1fr)`; 
    if (count === 4) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  };

  return (
    <AbsoluteFill style={{ padding: '40px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* TITRE DYNAMIQUE */}
      {content.titre && (
        <div style={{
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [-20, 0])}px)`,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.title * 0.7,
          fontWeight: 900,
          color: theme.colors.accent, // Utilisation de l'accent du thème
          textAlign: 'center',
          marginBottom: '40px',
          textTransform: 'uppercase',
          textShadow: '0 5px 15px rgba(0,0,0,0.3)'
        }}>
          {content.titre}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: getGridConfig(),
        gap: items.length > 4 ? '25px' : '40px',
        width: '100%',
        maxWidth: '1200px', 
        margin: '0 auto',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {items.map((item, i) => {
          const delay = entranceDelay + (i * stagger);
          const spr = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
          const exitOpacity = interpolate(frame, [totalFrames - 10, totalFrames], [1, 0], { extrapolateLeft: 'clamp' });
          const direction = i % 2 === 0 ? -100 : 100;
          const translateY = interpolate(spr, [0, 1], [direction, 0]);
          const scale = interpolate(spr, [0, 1], [0.5, 1]);

          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: spr * exitOpacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              width: '100%',
              maxWidth: items.length > 4 ? '320px' : (items.length <= 2 ? '450px' : '380px')
            }}>
              <div style={{
                width: '100%',
                aspectRatio: '1/1',
                backgroundColor: 'rgba(255,255,255,0.05)',
                // Bordure dynamique
                border: `4px solid ${theme.colors.accent}`,
                borderRadius: items.length > 4 ? '15px' : '25px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                position: 'relative'
              }}>
                {renderItemMedia(item, i)}
              </div>

              {content.points && content.points[i] && (
                <div style={{
                  marginTop: '15px',
                  color: theme.colors.text, // Texte dynamique
                  fontFamily: theme.typography.fontFamily,
                  fontSize: items.length > 4 ? '18px' : '24px',
                  fontWeight: 800,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  padding: '5px 15px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px'
                }}>
                  {content.points[i]}
                </div>
              )}

              {/* Synchronisation SFX avec volume dynamique */}
              <Sequence from={delay}>
                <Audio src={staticFile('/sfx/pop.mp3')} volume={theme.audio.sfxVolume} />
              </Sequence>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};