import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, staticFile, OffthreadVideo, Img, spring, interpolate, Sequence, Audio } from 'remotion';
import { Lottie, LottieAnimationData } from '@remotion/lottie';
import { Typewriter } from '../components/Typewriter';
import { THEME } from '../constants/theme';
import { LOTTIE_SFX_MAP } from '../constants/assets';

interface SplitProps {
  content: {
    leftContent?: { image?: string; texte?: string };
    rightContent?: { image?: string; texte?: string; mots_cles?: string[] };
    mots_cles?: string[];
  };
}

export const Split: React.FC<SplitProps> = ({ content }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const delay = 30; // Apparition
  const shiftDelay = delay + 50; // Moment du décalage (un peu plus de 1.5s)

  const mediaPath = content.leftContent?.image || "";
  const textToShow = content.rightContent?.texte || "";
  
  // Logique d'ajout : On récupère les mots-clés du bloc texte ou du content global
  const keywords = content.rightContent?.mots_cles || content.mots_cles || [];

  // Animation 1 : Surgissement initial (comme Concept)
  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  // Animation 2 : Le décalage vers le haut + réduction de taille
  const shift = spring({
    frame: frame - shiftDelay,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Logique de transformation combinée
  const dynamicScale = interpolate(shift, [0, 1], [entrance, 0.8]);
  const translateY = interpolate(shift, [0, 1], [0, -15]);

  const [lottieData, setLottieData] = useState<LottieAnimationData | null>(null);
  
  const assetKey = mediaPath.replace('.json', '');
  const sfxName = LOTTIE_SFX_MAP[assetKey] || LOTTIE_SFX_MAP['generic'];

  useEffect(() => {
    const isLottie = mediaPath && 
                     !mediaPath.toLowerCase().endsWith('.mp4') && 
                     !mediaPath.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);

    if (isLottie) {
      const fileName = mediaPath.endsWith('.json') ? mediaPath : `${mediaPath}.json`;
      fetch(staticFile(`/lotties/${fileName}`))
        .then((res) => {
          if (!res.ok) throw new Error(`Fichier non trouvé: /lotties/${fileName}`);
          return res.json();
        })
        .then((json) => setLottieData(json))
        .catch((err) => console.error("Erreur chargement Lottie Split:", err));
    }
  }, [mediaPath]);

  const renderMedia = () => {
    if (!mediaPath) return null;
    const finalUrl = mediaPath.startsWith('http') ? mediaPath : staticFile(mediaPath);
    const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain' };

    const isVideo = mediaPath.toLowerCase().endsWith('.mp4');
    const isImage = mediaPath.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);

    if (isVideo) {
      return <OffthreadVideo src={finalUrl} style={style} />;
    }

    if (!isImage) {
      if (lottieData) {
        return <Lottie {...({ animationData: lottieData, frame: Math.max(0, frame - delay), style } as any)} />;
      }
      return <div style={style} />;
    }

    return <Img src={finalUrl} style={style} />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      
      <Sequence from={delay}>
        <Audio src={staticFile(`/sfx/${sfxName}`)} volume={0.8} />
      </Sequence>

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
        <div style={{ width: '80%', height: '60%' }}>
          {renderMedia()}
        </div>
      </div>

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
        <Typewriter 
          text={textToShow} 
          keywords={keywords} // Les mots-clés sont maintenant passés ici
          delay={shiftDelay + 20}
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
      </div>
    </AbsoluteFill>
  );
};