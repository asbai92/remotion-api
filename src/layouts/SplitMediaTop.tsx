import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, interpolate, Sequence, Audio } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { Typewriter } from '../components/Typewriter';
import { LOTTIE_SFX_MAP } from '../constants/assets';

// 1. Import du hook pour le thème dynamique
import { useTheme } from '../context/ThemeContext';

interface SplitProps {
  content: {
    topContent?: { media?: string; texte?: string; mots_cles?: string[] };
    bottomContent?: { media?: string; texte?: string; mots_cles?: string[] };
    mots_cles?: string[];
  };
  durationInSeconds?: number;
}

export const SplitMediaTop: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme(); // 2. Accès au thème
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = durationInSeconds * fps;

  // DELAIS
  const delay = 10; 
  const shiftDelay = Math.floor(totalFrames * 0.2); 

  // Animations
  const entrance = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });
  const shift = spring({ frame: frame - shiftDelay, fps, config: { damping: 15, stiffness: 80 } });

  const dynamicScale = interpolate(shift, [0, 1], [entrance, 0.75]);
  const translateY = interpolate(shift, [0, 1], [0, -18]);

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
      const startFrame = isBottom ? shiftDelay + 10 : delay + 10;
      const writingEndFrame = totalFrames * 0.60; 
      
      const availableFrames = Math.max(20, writingEndFrame - startFrame);
      const idealSpeed = zone.texte.length / availableFrames;

      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={startFrame}
          speed={idealSpeed}
          // 3. Application des styles du thème
          baseStyle={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title * 0.65,
            textAlign: 'center',
            fontWeight: 900,
            color: theme.colors.text, 
            textTransform: 'uppercase',
            textShadow: '0px 5px 20px rgba(0,0,0,0.6)',
            width: '100%'
          }}
          highlightStyle={{
            color: theme.colors.accent // Accentuation dynamique
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
        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))'
      };
      
      const pathLower = zone.media.toLowerCase();
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - delay), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
      return <div style={style} />;
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.topContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Sequence from={delay}>
        <Audio 
          src={staticFile(`/sfx/${sfxName}`)} 
          volume={theme.audio.sfxVolume} // Volume SFX du thème
        />
      </Sequence>

      {/* ZONE MEDIA (Haut) */}
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
        <div style={{ width: '85%', height: '60%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderZone(content.topContent, lottieTop, false)}
        </div>
      </div>

      {/* ZONE TEXTE (Bas) */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        width: '100%',
        height: '35%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        opacity: shift,
        transform: `translateY(${interpolate(shift, [0, 1], [20, 0])}px)`
      }}>
        {renderZone(content.bottomContent, lottieBottom, true)}
      </div>
    </AbsoluteFill>
  );
};