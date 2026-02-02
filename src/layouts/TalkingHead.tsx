import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring, OffthreadVideo, staticFile } from 'remotion';
// Import du hook pour le thème
import { useTheme } from '../context/ThemeContext';

interface TalkingHeadProps {
  content: {
    media?: string;        // Pour une image ou un lottie d'illustration
    video_source?: string; // La vidéo de la personne qui parle
    texte_principal?: string;
  };
}

export const TalkingHead: React.FC<TalkingHeadProps> = ({ content }) => {
  const theme = useTheme(); // Accès au thème dynamique
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const videoSrc = content.video_source || content.media || "";
  
  const textEntrance = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* LA VIDÉO DE FOND */}
      {videoSrc && (
        <OffthreadVideo 
          src={videoSrc.startsWith('http') ? videoSrc : staticFile(videoSrc)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* OVERLAY DÉGRADÉ DYNAMIQUE */}
      {/* On utilise un noir profond qui tire vers la couleur d'accent très sombre si besoin */}
      <AbsoluteFill style={{
        background: `linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)`,
      }} />

      {/* TEXTE PRINCIPAL (STYLE SOUS-TITRE PREMIUM) */}
      {content.texte_principal && (
        <div style={{
          position: 'absolute',
          bottom: '12%',
          left: '8%',
          right: '8%',
          textAlign: 'center',
          opacity: textEntrance,
          transform: `translateY(${interpolate(textEntrance, [0, 1], [30, 0])}px)`,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSize.body * 1.4,
          fontWeight: 900,
          color: theme.colors.text, // Couleur du thème (souvent blanc ou très clair)
          textShadow: '0px 4px 20px rgba(0,0,0,1)', // Ombre plus forte pour détacher du fond vidéo
          lineHeight: 1.2,
          textTransform: 'uppercase', // Pour garder le punch des autres layouts
        }}>
          {/* Optionnel : Mettre un mot en couleur d'accent si nécessaire */}
          {content.texte_principal}
        </div>
      )}
    </AbsoluteFill>
  );
};