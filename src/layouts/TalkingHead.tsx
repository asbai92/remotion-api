import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate, spring, OffthreadVideo, staticFile } from 'remotion';
import { THEME } from '../constants/theme';

interface TalkingHeadProps {
  content: {
    media?: string;        // Pour une image ou un lottie d'illustration
    video_source?: string; // La vidéo de la personne qui parle
    texte_principal?: string;
  };
}

export const TalkingHead: React.FC<TalkingHeadProps> = ({ content }) => {
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

      {/* OVERLAY DÉGRADÉ POUR LA LISIBILITÉ */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
      }} />

      {/* TEXTE PRINCIPAL (SOUS-TITRE STYLE) */}
      {content.texte_principal && (
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          right: '10%',
          textAlign: 'center',
          opacity: textEntrance,
          transform: `translateY(${interpolate(textEntrance, [0, 1], [20, 0])}px)`,
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.body * 1.3,
          fontWeight: 800,
          color: 'white',
          textShadow: '0px 2px 15px rgba(0,0,0,0.9)',
          lineHeight: 1.3,
        }}>
          {content.texte_principal}
        </div>
      )}
    </AbsoluteFill>
  );
};