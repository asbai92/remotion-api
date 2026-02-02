import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile, Audio, spring, useVideoConfig, Sequence, Img, OffthreadVideo, interpolate } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { LOTTIE_SFX_MAP } from '../constants/assets';

// 1. Import du hook pour accéder au thème
import { useTheme } from '../context/ThemeContext';

interface ConceptProps {
  content: {
    media?: string; 
  };
  durationInSeconds?: number;
}

export const Concept: React.FC<ConceptProps> = ({ content, durationInSeconds = 5 }) => {
  // 2. Récupération du thème dynamique
  const theme = useTheme();
  
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const delay = 20; 
  
  const assetPath = content?.media || "";
  const [lottieData, setLottieData] = useState<LottieAnimationData | null>(null);

  const totalFrames = durationInSeconds * fps;

  // Animation d'entrée
  const scaleEntrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  // Mouvement de respiration
  const breathScale = interpolate(
    frame,
    [0, totalFrames],
    [1, 1.08], 
    { extrapolateRight: 'clamp' }
  );

  useEffect(() => {
    if (!assetPath) return;

    const isLottie = !assetPath.toLowerCase().endsWith('.mp4') && 
                     !assetPath.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);

    if (isLottie) {
      const fileName = assetPath.endsWith('.json') ? assetPath : `${assetPath}.json`;
      fetch(staticFile(`/lotties/${fileName}`))
        .then((res) => res.json())
        .then((json) => setLottieData(json))
        .catch((err) => console.error("Erreur Lottie Concept:", err));
    }
  }, [assetPath]);

  const renderMedia = () => {
    if (!assetPath) return null;

    const finalUrl = assetPath.startsWith('http') ? assetPath : staticFile(assetPath);
    const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain' };
    const pathLower = assetPath.toLowerCase();

    if (pathLower.endsWith('.mp4')) return <OffthreadVideo src={finalUrl} style={style} />;

    if (lottieData) {
      return (
        <Lottie 
          {...({
            animationData: lottieData,
            frame: Math.max(0, frame - delay),
            style: style
          } as any)} 
        />
      );
    }

    if (pathLower.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      return <Img src={finalUrl} style={style} />;
    }

    return null;
  };

  const assetKey = assetPath ? assetPath.split('/').pop()?.replace('.json', '') : "generic";
  const sfxName = LOTTIE_SFX_MAP[assetKey || ""] || LOTTIE_SFX_MAP['generic'];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
      
      {assetPath && (
        <Sequence from={delay}>
          <Audio 
            src={staticFile(`/sfx/${sfxName}`)} 
            // 3. Utilisation du volume SFX définit dans le thème
            volume={theme.audio.sfxVolume} 
          />
        </Sequence>
      )}

      <div style={{
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scaleEntrance * breathScale})`,
        opacity: frame < delay ? 0 : 1 
      }}>
        <div style={{ 
          width: '90%', 
          height: '90%',
          // Optionnel : Tu pourrais aussi utiliser theme.colors.accent pour colorer l'ombre si tu veux un effet "glow"
          filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.3))'
        }}>
          {renderMedia()}
        </div>
      </div>
    </AbsoluteFill>
  );
};