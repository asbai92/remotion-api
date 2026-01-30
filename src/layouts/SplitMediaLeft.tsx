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

export const SplitMediaLeft: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const totalFrames = durationInSeconds * fps;
  const delay = 20; 
  const textDelay = delay + 10;

  // Animations d'entrée
  const mediaEntrance = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const textEntrance = spring({ frame: frame - textDelay, fps, config: { damping: 12 } });

  const breathScale = interpolate(
    frame,
    [0, totalFrames],
    [1, 1.05],
    { extrapolateRight: 'clamp' }
  );

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
      // AJUSTEMENT : On finit d'écrire à 65% de la durée totale.
      // Cela laisse 35% de temps de pause (environ 1.7s pour une scène de 5s)
      const writingEndFrame = totalFrames * 0.65;
      const availableFrames = Math.max(20, writingEndFrame - (textDelay + 10));
      const idealSpeed = zone.texte.length / availableFrames;

      return (
        <Typewriter 
          text={zone.texte} 
          keywords={zoneKeywords}
          delay={textDelay + 10}
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
        filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))'
      };
      const pathLower = zone.media.toLowerCase();
      
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - delay), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
      return <div style={style} />;
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.leftContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      transform: `scale(${breathScale})`
    }}>
      
      {content.leftContent?.media && (
        <Sequence from={delay}>
          <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
        </Sequence>
      )}

      {/* COLONNE GAUCHE (Média) */}
      <div style={{ 
        flex: 1.2, 
        height: '70%',
        transform: `scale(${mediaEntrance})`,
        opacity: mediaEntrance,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderZone(content.leftContent, lottieTop)}
      </div>

      <div style={{ width: 80 }} />

      {/* COLONNE DROITE (Texte avec pause finale) */}
      <div style={{ 
        flex: 1, 
        opacity: textEntrance,
        transform: `translateX(${interpolate(textEntrance, [0, 1], [60, 0])}px)`,
        display: 'flex',
        alignItems: 'center'
      }}>
        {renderZone(content.rightContent, lottieBottom)}
      </div>

    </AbsoluteFill>
  );
};