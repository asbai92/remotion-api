import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile, Audio, spring, useVideoConfig, Sequence } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { LOTTIE_SFX_MAP } from '../constants/assets';

interface ConceptProps {
  // On passe 'content' pour matcher ton JSON : content.lottie
  content: {
    lottie?: string;
  };
}

export const Concept: React.FC<ConceptProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const delay = 30; 
  
  // Sécurité : on récupère la valeur ou une chaîne vide pour éviter le crash .toLowerCase()
  const lottieAsset = content?.lottie || "";
  
  const lottieFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const [data, setData] = useState<LottieAnimationData | null>(null);
  
  // On nettoie la clé seulement si lottieAsset existe
  const assetKey = lottieAsset ? lottieAsset.replace('.json', '') : "generic";
  const sfxName = LOTTIE_SFX_MAP[assetKey] || LOTTIE_SFX_MAP['generic'];

  useEffect(() => {
    // Si pas de lottie spécifié, on ne fait rien
    if (!lottieAsset) return;

    const fileName = lottieAsset.endsWith('.json') ? lottieAsset : `${lottieAsset}.json`;
    fetch(staticFile(`/lotties/${fileName}`))
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Erreur Lottie:", err));
  }, [lottieAsset]);

  if (!data) return null;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
      
      {/* SFX déclenché après la transition */}
      <Sequence from={delay}>
        <Audio 
          src={staticFile(`/sfx/${sfxName}`)} 
          volume={0.8} 
        />
      </Sequence>

      <div style={{
        width: '100%', 
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale})`,
        opacity: frame < delay ? 0 : 1 
      }}>
        <div style={{ width: '80%', height: '80%' }}>
          <Lottie 
            {...({
              animationData: data,
              frame: lottieFrame,
              playbackRate: 1,
              loop: true,
              style: { width: '100%', height: '100%', objectFit: 'contain' }
            } as any)} 
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};