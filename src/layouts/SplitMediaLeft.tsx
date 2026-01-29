import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
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
}

export const SplitMediaLeft: React.FC<SplitProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const delay = 30;
  const textDelay = delay + 15;

  // Animations
  const mediaEntrance = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const textEntrance = spring({ frame: frame - textDelay, fps });

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

  const renderZone = (zone: { media?: string; texte?: string; mots_cles?: string[] } | undefined, lottieData: any, isMedia: boolean) => {
    if (!zone) return null;
    const zoneKeywords = zone.mots_cles || content.mots_cles || [];

    if (zone.texte && !zone.media) {
      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={textDelay + 10}
          baseStyle={{
            fontFamily: THEME.typography.fontFamily,
            fontSize: THEME.typography.fontSize.title * 0.7,
            textAlign: 'right', // Aligné à droite car le texte est dans la colonne de droite
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0px 0px 15px rgba(0,0,0,0.7)',
            width: '100%'
          }}
        />
      );
    }

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

  const sfxName = LOTTIE_SFX_MAP[(content.topContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px'
    }}>
      
      {content.topContent?.media && (
        <Sequence from={delay}>
          <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
        </Sequence>
      )}

      {/* COLONNE GAUCHE (Média) */}
      <div style={{ 
        flex: 1.2, 
        height: '60%',
        transform: `scale(${mediaEntrance})`,
        opacity: mediaEntrance
      }}>
        {renderZone(content.topContent, lottieTop, true)}
      </div>

      {/* ESPACE ENTRE LES DEUX */}
      <div style={{ width: 60 }} />

      {/* COLONNE DROITE (Texte) */}
      <div style={{ 
        flex: 1, 
        opacity: textEntrance,
        transform: `translateX(${interpolate(textEntrance, [0, 1], [50, 0])}px)` 
      }}>
        {renderZone(content.bottomContent, lottieBottom, false)}
      </div>

    </AbsoluteFill>
  );
};