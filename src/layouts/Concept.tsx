import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile, Audio, spring, useVideoConfig, Sequence, Img, OffthreadVideo } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { LOTTIE_SFX_MAP } from '../constants/assets';

interface ConceptProps {
  content: {
    // Changement ici : 'lottie' devient 'media' pour matcher ton nouveau schéma
    media?: string; 
  };
}

export const Concept: React.FC<ConceptProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const delay = 30; 
  
  // On récupère 'media' au lieu de 'lottie'
  const assetPath = content?.media || "";
  const [lottieData, setLottieData] = useState<LottieAnimationData | null>(null);

  // Animation de zoom
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  useEffect(() => {
    if (!assetPath) return;

    // Détection si c'est un Lottie
    const isLottie = !assetPath.toLowerCase().endsWith('.mp4') && 
                     !assetPath.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);

    if (isLottie) {
      const fileName = assetPath.endsWith('.json') ? assetPath : `${assetPath}.json`;
      fetch(staticFile(`/lotties/${fileName}`))
        .then((res) => res.json())
        .then((json) => setLottieData(json))
        .catch((err) => console.error("Erreur Lottie:", err));
    }
  }, [assetPath]);

  // Rendu dynamique
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
            volume={0.8} 
          />
        </Sequence>
      )}

      <div style={{
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale})`,
        opacity: frame < delay ? 0 : 1 
      }}>
        <div style={{ width: '85%', height: '85%' }}>
          {renderMedia()}
        </div>
      </div>
    </AbsoluteFill>
  );
};