import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, interpolate, Sequence, Audio } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { LOTTIE_SFX_MAP } from '../constants/assets';
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
  const theme = useTheme();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = durationInSeconds * fps;

  // DELAIS
  const delay = 10; 
  const shiftDelay = Math.floor(totalFrames * 0.2); 

  // Animations de structure
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

    // --- ANIMATION WORD POP ---
    if (zone.texte && !zone.media) {
      const words = zone.texte.split(' ');
      const startFrame = isBottom ? shiftDelay + 5 : delay + 5;

      return (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px 15px', 
          justifyContent: 'center', 
          width: '100%'
        }}>
          {/* JOUE TON SFX DOUBLE POP (qui contient déjà les deux sons) */}
          <Sequence from={startFrame} layout="none">
            <Audio 
              src={staticFile('/sfx/double_pop.mp3')} 
              volume={theme.audio.sfxVolume} 
            />
          </Sequence>

          {words.map((word, i) => {
            const wordStartFrame = startFrame + (i * 3);
            const spr = spring({
              frame: frame - wordStartFrame,
              fps,
              config: { damping: 12, stiffness: 120 }
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
                  transform: `scale(${interpolate(spr, [0, 1], [0.6, 1])}) translateY(${interpolate(spr, [0, 1], [15, 0])}px)`,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.fontSize.title * 0.7,
                  fontWeight: 900,
                  color: isKeyword ? theme.colors.accent : theme.colors.text,
                  textTransform: 'uppercase',
                  textShadow: '0px 8px 20px rgba(0,0,0,0.5)',
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
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.topContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Sequence from={delay}>
        <Audio 
          src={staticFile(`/sfx/${sfxName}`)} 
          volume={theme.audio.sfxVolume} 
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

      {/* ZONE TEXTE (Bas - Pop) */}
      <div style={{
        position: 'absolute',
        bottom: '8%',
        width: '100%',
        height: '40%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 40px',
        opacity: shift,
      }}>
        {renderZone(content.bottomContent, lottieBottom, true)}
      </div>
    </AbsoluteFill>
  );
};