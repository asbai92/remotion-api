import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, Sequence, Audio, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { LOTTIE_SFX_MAP } from '../constants/assets';
import { useTheme } from '../context/ThemeContext';

interface SplitProps {
  content: {
    leftContent?: { media?: string; texte?: string; mots_cles?: string[] };
    rightContent?: { media?: string; texte?: string; mots_cles?: string[] };
    mots_cles?: string[];
  };
  durationInSeconds?: number;
}

export const SplitMediaLeft: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const totalFrames = durationInSeconds * fps;
  const delay = 15; 
  const textDelay = delay + 5;

  const breathScale = interpolate(frame, [0, totalFrames], [1, 1.03], { extrapolateRight: 'clamp' });

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
      const words = zone.texte.split(' ');
      
      return (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px 20px', 
          justifyContent: 'flex-start' 
        }}>
          {/* JOUER LE SFX DOUBLE POP UNE SEULE FOIS AU DÉBUT DU TEXTE */}
          <Sequence from={textDelay} layout="none">
             <Audio 
               src={staticFile('/sfx/double_pop.mp3')} 
               volume={theme.audio.sfxVolume} 
             />
          </Sequence>

          {words.map((word, i) => {
            const wordStartFrame = textDelay + (i * 3);
            const spr = spring({
              frame: frame - wordStartFrame,
              fps,
              config: { damping: 12, stiffness: 100 }
            });

            const cleanWord = word.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
            const isKeyword = zoneKeywords.some(k => {
               const cleanK = k.toUpperCase().replace(/[^A-ZÀ-Ÿ0-9]/g, "");
               return cleanWord.includes(cleanK) || cleanK.includes(cleanWord);
            });

            return (
              <div
                key={i}
                style={{
                  opacity: spr,
                  transform: `scale(${interpolate(spr, [0, 1], [0.5, 1])}) translateY(${interpolate(spr, [0, 1], [20, 0])}px)`,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.fontSize.title * 0.7,
                  fontWeight: 900,
                  color: isKeyword ? theme.colors.accent : theme.colors.text,
                  textTransform: 'uppercase',
                  textShadow: '0px 10px 20px rgba(0,0,0,0.4)',
                }}
              >
                {word}
              </div>
            );
          })}
        </div>
      );
    }

    if (zone.media) {
      const finalUrl = zone.media.startsWith('http') ? zone.media : staticFile(zone.media);
      const entrance = spring({ frame: frame - delay, fps, config: { damping: 12 } });
      const style: React.CSSProperties = { 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain',
        filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
        transform: `scale(${entrance})`,
        opacity: entrance
      };
      
      const pathLower = zone.media.toLowerCase();
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - delay), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
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
      padding: '0 80px',
      transform: `scale(${breathScale})`
    }}>
      
      <Sequence from={delay}>
        <Audio src={staticFile(`/sfx/${sfxName}`)} volume={theme.audio.sfxVolume} />
      </Sequence>

      <div style={{ flex: 1.1, height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderZone(content.leftContent, lottieTop)}
      </div>

      <div style={{ width: 60 }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {renderZone(content.rightContent, lottieBottom)}
      </div>

    </AbsoluteFill>
  );
};