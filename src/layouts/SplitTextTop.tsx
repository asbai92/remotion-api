import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, interpolate, Sequence, Audio } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { Typewriter } from '../components/Typewriter';
import { THEME } from '../constants/theme';
import { LOTTIE_SFX_MAP } from '../constants/assets';

interface SplitProps {
  content: {
    topContent?: { media?: string; texte?: string; mots_cles?: string[] };
    bottomContent?: { media?: string; texte?: string; mots_cles?: string[] };
    mots_cles?: string[];
  };
  durationInSeconds?: number;
}

export const SplitTextTop: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = durationInSeconds * fps;
  
  const delay = 15;
  
  // 1. On garde le shiftDelay à 60% comme tu l'as souhaité
  const shiftDelay = Math.floor(totalFrames * 0.60);

  // 2. On définit la fin de l'écriture 1 seconde (fps) AVANT le shiftDelay
  // Si la scène est trop courte, on s'assure d'avoir au moins 15 frames de battement
  const writingEndFrameTop = Math.max(delay + 20, shiftDelay - fps);

  // Animations
  const entrance = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
  const shift = spring({ frame: frame - shiftDelay, fps, config: { damping: 15, stiffness: 80 } });

  const dynamicScale = interpolate(shift, [0, 1], [entrance, 0.75]);
  const translateY = interpolate(shift, [0, 1], [0, -22]);

  const [lottieTop, setLottieTop] = useState<LottieAnimationData | null>(null);
  const [lottieBottom, setLottieBottom] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    const loadLottie = (path: string | undefined, setter: (d: any) => void) => {
      if (!path) return;
      const isLottie = !path.toLowerCase().endsWith('.mp4') && !path.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);
      if (isLottie) {
        const fileName = path.endsWith('.json') ? path : `${path}.json`;
        fetch(staticFile(`/lotties/${fileName}`)).then(res => res.json()).then(setter).catch(e => console.error(e));
      }
    };
    loadLottie(content.topContent?.media, setLottieTop);
    loadLottie(content.bottomContent?.media, setLottieBottom);
  }, [content.topContent?.media, content.bottomContent?.media]);

  const renderZone = (zone: { media?: string; texte?: string; mots_cles?: string[] } | undefined, lottieData: any, isBottom: boolean) => {
    if (!zone) return null;
    const zoneKeywords = zone.mots_cles || content.mots_cles || [];

    if (zone.texte && !zone.media) {
      const startFrame = isBottom ? shiftDelay + 15 : delay + 10;
      
      // Utilisation du writingEndFrameTop calculé pour le texte du haut
      const writingEndFrame = isBottom ? totalFrames * 0.95 : writingEndFrameTop; 
      
      const availableFrames = Math.max(20, writingEndFrame - startFrame);
      const idealSpeed = zone.texte.length / availableFrames;

      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={startFrame}
          speed={idealSpeed}
          baseStyle={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.fontSize.title * 0.75,
            textAlign: 'center',
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0px 5px 20px rgba(0,0,0,0.6)',
            width: '100%'
          }}
        />
      );
    }

    if (zone.media) {
      const finalUrl = zone.media.startsWith('http') ? zone.media : staticFile(zone.media);
      const style: React.CSSProperties = { 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain',
        filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.4))'
      };
      const pathLower = zone.media.toLowerCase();
      
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - (isBottom ? shiftDelay : delay)), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
      return <div style={style} />;
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.bottomContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      
      {content.bottomContent?.media && (
        <Sequence from={shiftDelay}>
          <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
        </Sequence>
      )}

      {/* ZONE DU HAUT (Texte) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `translateY(${translateY}%) scale(${dynamicScale})`,
        opacity: entrance,
      }}>
        <div style={{ width: '90%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderZone(content.topContent, lottieTop, false)}
        </div>
      </div>

      {/* ZONE DU BAS (Média) */}
      <div style={{
        position: 'absolute',
        bottom: '12%',
        width: '100%',
        height: '42%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        opacity: shift,
        transform: `translateY(${interpolate(shift, [0, 1], [30, 0])}px)`
      }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderZone(content.bottomContent, lottieBottom, true)}
        </div>
      </div>
    </AbsoluteFill>
  );
};