import React from 'react';
import { AbsoluteFill, Audio, staticFile, useVideoConfig, OffthreadVideo, Loop, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { ProjectConfig } from './types/schema';
import { Hero } from './layouts/Hero';
import { Concept } from './layouts/Concept';

// Import des 4 variantes de SPLIT
import { SplitTextTop } from './layouts/SplitTextTop';
import { SplitMediaTop } from './layouts/SplitMediaTop';
import { SplitTextLeft } from './layouts/SplitTextLeft';
import { SplitMediaLeft } from './layouts/SplitMediaLeft';

import { TRANSITION_SFX_MAP } from './constants/assets';

const TRANSITIONS = [
  { name: 'slide', component: () => slide() },
  { name: 'fade', component: () => fade() },
  { name: 'wipe', component: () => wipe() },
  { name: 'flip', component: () => flip() },
];

export const Main: React.FC<ProjectConfig> = ({ scenes }) => {
  const { fps } = useVideoConfig();
  const transitionDuration = Math.round(fps * 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill>
        <Loop durationInFrames={fps * 10}> 
          <OffthreadVideo
            src={staticFile('/branding/background.mp4')}
            style={{ objectFit: 'cover', width: '100%', height: '100%', opacity: 0.8 }}
          />
        </Loop>
      </AbsoluteFill>

      <Audio src={staticFile('/branding/music.mp3')} volume={0.1} loop />

      <TransitionSeries>
        {scenes.flatMap((scene, index) => {
          const duration = Math.round(scene.duree_vo * fps);
          const isLast = index === scenes.length - 1;

          const type = TRANSITIONS[index % TRANSITIONS.length];
          const presentation = type.component() as any;
          const sfx = TRANSITION_SFX_MAP[type.name] || TRANSITION_SFX_MAP['generic'];

          const sequence = (
            <TransitionSeries.Sequence key={`seq-${index}`} durationInFrames={duration}>
              {scene.layout === 'HERO' && (
                <Hero text={scene.content.texte_principal || ""} keywords={scene.content.mots_cles} />
              )}

              {scene.layout === 'CONCEPT' && (
                <Concept content={scene.content} />
              )}

              {/* Gestion des 4 layouts SPLIT */}
              {scene.layout === 'SPLIT_TEXT_TOP' && (
                <SplitTextTop content={scene.content} />
              )}

              {scene.layout === 'SPLIT_MEDIA_TOP' && (
                <SplitMediaTop content={scene.content} />
              )}

              {scene.layout === 'SPLIT_TEXT_LEFT' && (
                <SplitTextLeft content={scene.content} />
              )}

              {scene.layout === 'SPLIT_MEDIA_LEFT' && (
                <SplitMediaLeft content={scene.content} />
              )}
              
              <Audio src={scene.audio_voix_off} />
              
              {!isLast && (
                <Sequence from={duration - Math.round(transitionDuration / 2)}>
                  <Audio 
                    src={staticFile(`/transitions-sfx/${sfx}`)} 
                    volume={0.6} 
                  />
                </Sequence>
              )}
            </TransitionSeries.Sequence>
          );

          if (isLast) return [sequence];

          const transition = (
            <TransitionSeries.Transition
              key={`trans-${index}`}
              presentation={presentation}
              timing={linearTiming({ durationInFrames: transitionDuration })}
            />
          );

          return [sequence, transition];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};