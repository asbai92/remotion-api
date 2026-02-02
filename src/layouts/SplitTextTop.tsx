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

export const SplitTextTop: React.FC<SplitProps> = ({ content, durationInSeconds = 5 }) => {
  const theme = useTheme();
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const totalFrames = durationInSeconds * fps;
  
  const delay = 15;
  const shiftDelay = Math.floor(totalFrames * 0.60);

  // Animations de structure
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

    // --- ANIMATION WORD POP ---
    if (zone.texte && !zone.media) {
      const words = zone.texte.split(' ');
      const startFrame = isBottom ? shiftDelay + 10 : delay + 10;

      return (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px 18px', 
          justifyContent: 'center', 
          width: '100%' 
        }}>
          {/* JOUE LE SFX DOUBLE POP (Un seul fichier) AU DÉBUT DU BLOC TEXTE */}
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
                  fontSize: theme.typography.fontSize.title * 0.75,
                  fontWeight: 900,
                  color: isKeyword ? theme.colors.accent : theme.colors.text,
                  textTransform: 'uppercase',
                  textShadow: '0px 10px 25px rgba(0,0,0,0.5)',
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
        filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.4))'
      };
      const pathLower = zone.media.toLowerCase();
      
      if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;
      if (lottieData) return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - (isBottom ? shiftDelay : delay)), style } as any)} />;
      if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) return <Img src={finalUrl} style={style} />;
    }
    return null;
  };

  const sfxName = LOTTIE_SFX_MAP[(content.bottomContent?.media || "").replace('.json', '')] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      
      {content.bottomContent?.media && (
        <Sequence from={shiftDelay}>
          <Audio 
            src={staticFile(`/sfx/${sfxName}`)} 
            volume={theme.audio.sfxVolume} 
          />
        </Sequence>
      )}

      {/* ZONE DU HAUT (Texte pivot - Word Pop) */}
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

      {/* ZONE DU BAS (Média ou Texte secondaire) */}
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