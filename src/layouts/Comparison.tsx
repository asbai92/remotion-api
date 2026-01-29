import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { THEME } from '../constants/theme';

interface ComparisonProps {
  content: {
    titre?: string;
    medias?: string[]; // [Généralement 2 pour Avant/Après]
    points?: string[]; // [Généralement 2 pour les textes colonnes]
  };
}

export const Comparison: React.FC<ComparisonProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const items = content.medias || [];
  
  // On sépare les données pour les deux colonnes
  const colLeft = { media: items[0], point: content.points?.[0] };
  const colRight = { media: items[1], point: content.points?.[1] };

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
          .catch(e => console.error("Erreur Lottie Comparison:", e));
      }
    });
  }, [items]);

  const renderItemMedia = (src: string | undefined, index: number) => {
    if (!src) return null;
    const finalUrl = src.startsWith('http') ? src : staticFile(src);
    const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
    const pathLower = src.toLowerCase();
    
    if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
    if (lotties[index]) return <Lottie {...({ animationData: lotties[index], frame: Math.max(0, frame - 30), style: { width: '80%', height: '80%', objectFit: 'contain' } } as any)} />;
    if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/) || src.startsWith('http')) return <Img src={finalUrl} style={style} />;
    return null;
  };

  const spr = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  const titleEntrance = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  const renderColumn = (data: {media?: string, point?: string}, index: number, side: 'left' | 'right') => {
    const direction = side === 'left' ? -100 : 100;
    const translateX = interpolate(spr, [0, 1], [direction, 0]);

    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        opacity: spr,
        transform: `translateX(${translateX}px)`,
        zIndex: 2
      }}>
        {/* Titre de colonne Avant / Après (Optionnel via points) */}
        <div style={{
            width: '100%',
            aspectRatio: '1/1',
            maxWidth: '400px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: `4px solid ${THEME.colors.accent}`,
            borderRadius: '25px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            {renderItemMedia(data.media, index)}
        </div>

        {data.point && (
          <div style={{
            marginTop: '30px',
            fontFamily: THEME.typography.fontFamily,
            fontSize: '32px',
            fontWeight: 900,
            textAlign: 'center',
            textTransform: 'uppercase',
            backgroundColor: THEME.colors.accent,
            padding: '10px 30px',
            borderRadius: '50px',
            color: '#000'
          }}>
            {data.point}
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* TITRE PRINCIPAL */}
      {content.titre && (
        <div style={{
          position: 'absolute',
          top: 80,
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [-20, 0])}px)`,
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.title * 0.6,
          fontWeight: 900,
          color: 'white',
          textAlign: 'center',
          textTransform: 'uppercase',
          textShadow: '0 5px 15px rgba(0,0,0,0.5)'
        }}>
          {content.titre}
        </div>
      )}

      {/* CONTENEUR COMPARISON */}
      <div style={{ display: 'flex', width: '100%', height: '70%', alignItems: 'center', position: 'relative' }}>
        
        {renderColumn(colLeft, 0, 'left')}

        {/* LIGNE DE SÉPARATION CENTRALE */}
        <div style={{
          width: '4px',
          height: interpolate(spr, [0.5, 1], [0, 80], { extrapolateLeft: 'clamp' }) + '%',
          backgroundColor: THEME.colors.accent,
          boxShadow: `0 0 20px ${THEME.colors.accent}`,
          position: 'relative',
          borderRadius: '10px',
          opacity: spr
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(' + spr + ')',
            backgroundColor: '#000',
            border: `3px solid ${THEME.colors.accent}`,
            color: THEME.colors.accent,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '30px',
            fontWeight: 900,
            zIndex: 10
          }}>
            VS
          </div>
        </div>

        {renderColumn(colRight, 1, 'right')}
      </div>

      <Sequence from={20}>
        <Audio src={staticFile('/transitions-sfx/whoosh1.mp3')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};