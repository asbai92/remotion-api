import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { Typewriter } from '../components/Typewriter';
import { THEME } from '../constants/theme';
import { LOTTIE_SFX_MAP } from '../constants/assets';

interface SplitProps {
  content: {
    leftContent?: { media?: string; texte?: string; mots_cles?: string[] };
    rightContent?: { media?: string; texte?: string; mots_cles?: string[] };
    mots_cles?: string[];
  };
  durationInSeconds?: number;
}

export const SplitTextLeft: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = durationInSeconds * fps;
  
  const delay = 15; 
  
  // 1. On règle l'arrivée du média à 60% de la durée pour laisser du temps au texte
  const mediaDelay = Math.floor(totalFrames * 0.6); 

  // 2. Le texte finit d'écrire 1 seconde (fps) AVANT le média
  const writingEndFrame = Math.max(delay + 20, mediaDelay - fps);

  // Animations
  const textEntrance = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const mediaEntrance = spring({ frame: frame - mediaDelay, fps, config: { damping: 12 } });

  const breath = interpolate(frame, [0, totalFrames], [1, 1.04]);

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
    loadLottie(content.leftContent?.media, setLottieTop);
    loadLottie(content.rightContent?.media, setLottieBottom);
  }, [content.leftContent?.media, content.rightContent?.media]);

  const renderZone = (zone: { media?: string; texte?: string; mots_cles?: string[] } | undefined, lottieData: any) => {
    if (!zone) return null;
    const zoneKeywords = zone.mots_cles || content.mots_cles || [];

    if (zone.texte && !zone.media) {
      // Calcul de la vitesse pour finir à writingEndFrame
      const availableFrames = Math.max(20, writingEndFrame - (delay + 10));
      const idealSpeed = zone.texte.length / availableFrames;

      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={delay + 10}
          speed={idealSpeed}
          baseStyle={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.fontSize.title * 0.65,
            textAlign: 'left',
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0px 5px 15px rgba(0,0,0,0.5)',
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
        filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.4))'
      };
      const pathLower = zone.media.toLowerCase();
      
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - mediaDelay), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
      return <div style={style} />;
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.rightContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      transform: `scale(${breath})`
    }}>
      
      {content.rightContent?.media && (
        <Sequence from={mediaDelay}>
          <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
        </Sequence>
      )}

      {/* COLONNE GAUCHE (Texte qui s'écrit et attend) */}
      <div style={{ 
        flex: 1, 
        opacity: textEntrance,
        transform: `translateX(${interpolate(textEntrance, [0, 1], [-60, 0])}px)` 
      }}>
        {renderZone(content.leftContent, lottieTop)}
      </div>

      <div style={{ width: 60 }} />

      {/* COLONNE DROITE (Média qui arrive après la pause) */}
      <div style={{ 
        flex: 1.2, 
        height: '65%',
        transform: `scale(${mediaEntrance})`,
        opacity: mediaEntrance,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderZone(content.rightContent, lottieBottom)}
      </div>

    </AbsoluteFill>
  );
};