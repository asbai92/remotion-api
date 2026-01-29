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
    mots_cles?: string[]; // Fallback global
  };
}

export const SplitMediaTop: React.FC<SplitProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const delay = 30;
  const shiftDelay = delay + 50;

  // Animation Image (Haut)
  const entrance = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100, mass: 0.8 } });
  const shift = spring({ frame: frame - shiftDelay, fps, config: { damping: 15, stiffness: 80 } });

  const dynamicScale = interpolate(shift, [0, 1], [entrance, 0.8]);
  const translateY = interpolate(shift, [0, 1], [0, -15]);

  // États pour les Lotties
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

    // Récupération des mots clés spécifiques à la zone ou globaux
    const zoneKeywords = zone.mots_cles || content.mots_cles || [];

    // Priorité au TEXTE s'il n'y a pas de média
    if (zone.texte && !zone.media) {
      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={isBottom ? shiftDelay + 20 : delay + 10}
          baseStyle={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.fontSize.title * 0.7,
            textAlign: 'center',
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0px 0px 15px rgba(0,0,0,0.7)'
          }}
        />
      );
    }

    // Priorité au MÉDIA
    if (zone.media) {
      const finalUrl = zone.media.startsWith('http') ? zone.media : staticFile(zone.media);
      const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain' };
      
      const pathLower = zone.media.toLowerCase();
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - delay), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
      return <div style={style} />;
    }
    return null;
  };

  // SFX basé sur le média du haut
  const sfxName = LOTTIE_SFX_MAP[(content.topContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Sequence from={delay}>
        <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
      </Sequence>

      {/* ZONE DU HAUT (topContent) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `translateY(${translateY}%) scale(${dynamicScale})`,
        opacity: frame < delay ? 0 : 1,
      }}>
        <div style={{ width: '80%', height: '60%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {renderZone(content.topContent, lottieTop, false)}
        </div>
      </div>

      {/* ZONE DU BAS (bottomContent) */}
      <div style={{
        position: 'absolute',
        bottom: '8%',
        width: '100%',
        height: '40%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        opacity: frame < shiftDelay + 10 ? 0 : 1,
      }}>
        {renderZone(content.bottomContent, lottieBottom, true)}
      </div>
    </AbsoluteFill>
  );
};