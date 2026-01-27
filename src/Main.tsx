import React from 'react';
import { AbsoluteFill, Audio, staticFile, useVideoConfig, Series, OffthreadVideo, Loop } from 'remotion';
import { ProjectConfig } from './types/schema';
import { Hero } from './layouts/Hero';

export const Main: React.FC<ProjectConfig> = ({ scenes }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* 1. Background avec OffthreadVideo pour une stabilité totale */}
      <AbsoluteFill>
        {/* On boucle sur une durée fixe (ex: 10s) pour assurer la répétition */}
        <Loop durationInFrames={fps * 10}> 
          <OffthreadVideo
            src={staticFile('/branding/background.mp4')}
            style={{ 
              objectFit: 'cover', 
              width: '100%', 
              height: '100%', 
              opacity: 0.4 
            }}
          />
        </Loop>
      </AbsoluteFill>

      {/* 2. Musique de fond */}
      <Audio
        src={staticFile('/branding/music.mp3')}
        volume={0.2}
        loop
      />

      {/* 3. Séquence des Scènes */}
      <Series>
        {scenes.map((scene, index) => {
          const duration = Math.round(scene.duree_vo * fps);
          
          return (
            <Series.Sequence 
              key={`${index}-${scene.layout}`} 
              durationInFrames={duration}
            >
              {scene.layout === 'HERO' && (
                <Hero 
                  text={scene.content.texte_principal || ""} 
                  keywords={scene.content.mots_cles} 
                />
              )}
              
              {/* Audio Voix-off spécifique à la scène */}
              <Audio src={scene.audio_voix_off} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};