import React from 'react';
import { 
  AbsoluteFill, 
  Audio, 
  staticFile, 
  useVideoConfig, 
  OffthreadVideo, 
  Loop, 
  Sequence, 
  Img 
} from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';

// Context & Constants
import { ThemeProvider } from './context/ThemeContext'; 
import { getTheme } from './constants/theme';
import { ProjectConfig } from './types/schema';
import { TRANSITION_SFX_MAP } from './constants/assets';

// Layouts
import { Hero } from './layouts/Hero';
import { Concept } from './layouts/Concept';
import { List } from './layouts/List';
import { TalkingHead } from './layouts/TalkingHead';
import { SplitTextTop } from './layouts/SplitTextTop';
import { SplitMediaTop } from './layouts/SplitMediaTop';
import { SplitTextLeft } from './layouts/SplitTextLeft';
import { SplitMediaLeft } from './layouts/SplitMediaLeft';
import { Grid } from './layouts/Grid';
import { Comparison } from './layouts/Comparison';
import { Diagram } from './layouts/Diagram';

const TRANSITIONS = [
  { name: 'slide', component: () => slide() },
  { name: 'fade', component: () => fade() },
  { name: 'wipe', component: () => wipe() },
  { name: 'flip', component: () => flip() },
];

export const Main: React.FC<ProjectConfig> = ({ scenes, config_globale }) => {
  const { fps } = useVideoConfig();
  const transitionDuration = Math.round(fps * 0.5);

  // 1. RÉCUPÉRATION DU THÈME
  const theme = getTheme(config_globale?.theme || 'youtube_video');

  // 2. LOGIQUE DE RENDU DU BACKGROUND (Video / Image / Couleur)
  const renderBackground = () => {
    const bgAsset = theme.assets.backgroundVideo; 
    
    if (!bgAsset) return null;

    const isVideo = bgAsset.toLowerCase().endsWith('.mp4') || bgAsset.toLowerCase().endsWith('.webm');
    const isImage = bgAsset.toLowerCase().match(/\.(jpg|jpeg|png|webp|avif)$/);
    const finalSrc = bgAsset.startsWith('http') ? bgAsset : staticFile(bgAsset);

    const style: React.CSSProperties = { 
      objectFit: 'cover', 
      width: '100%', 
      height: '100%', 
      opacity: 0.8 
    };

    if (isVideo) {
      return (
        <Loop durationInFrames={fps * 10}>
          <OffthreadVideo src={finalSrc} style={style} />
        </Loop>
      );
    }

    if (isImage) {
      return <Img src={finalSrc} style={style} />;
    }

    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <AbsoluteFill style={{ 
        backgroundColor: theme.colors.background, 
        fontFamily: theme.typography.fontFamily 
      }}>
        
        {/* COUCHE BACKGROUND GLOBAL */}
        <AbsoluteFill>
          {renderBackground()}
        </AbsoluteFill>

        {/* MUSIQUE DE FOND (Rendue uniquement si définie) */}
        {theme.assets.backgroundMusic && (
          <Audio 
            src={theme.assets.backgroundMusic.startsWith('http') 
              ? theme.assets.backgroundMusic 
              : staticFile(theme.assets.backgroundMusic)} 
            volume={theme.audio.musicVolume} 
            loop 
          />
        )}

        <TransitionSeries>
          {scenes.flatMap((scene, index) => {
            const duration = Math.round(scene.duree_vo * fps);
            const isLast = index === scenes.length - 1;

            const type = TRANSITIONS[index % TRANSITIONS.length];
            const presentation = type.component() as any;
            const sfx = TRANSITION_SFX_MAP[type.name] || TRANSITION_SFX_MAP['generic'];

            const sequence = (
              <TransitionSeries.Sequence key={`seq-${index}`} durationInFrames={duration}>
                
                {/* LAYOUTS DYNAMIQUES */}
                {scene.layout === 'HERO' && (
                  <Hero 
                    content={{text: scene.content.texte_principal || "", keywords: scene.content.mots_cles}} 
                    durationInSeconds={scene.duree_vo} 
                  />
                )}
                
                {scene.layout === 'CONCEPT' && <Concept content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'LIST' && <List content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'TALKING_HEAD' && <TalkingHead content={scene.content} />}
                {scene.layout === 'SPLIT_TEXT_TOP' && <SplitTextTop content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'SPLIT_MEDIA_TOP' && <SplitMediaTop content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'SPLIT_TEXT_LEFT' && <SplitTextLeft content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'SPLIT_MEDIA_LEFT' && <SplitMediaLeft content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'GRID' && <Grid content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'COMPARISON' && <Comparison content={scene.content} durationInSeconds={scene.duree_vo} />}
                {scene.layout === 'DIAGRAM' && <Diagram content={scene.content} durationInSeconds={scene.duree_vo} />}
                
                {/* VOIX OFF DE LA SCÈNE */}
                {scene.audio_voix_off && (
                  <Audio 
                    src={scene.audio_voix_off.startsWith('http') 
                      ? scene.audio_voix_off 
                      : staticFile(scene.audio_voix_off)} 
                  />
                )}
                
                {/* SFX DE TRANSITION (entre les scènes) */}
                {!isLast && (
                  <Sequence from={duration - Math.round(transitionDuration / 2)}>
                    <Audio 
                      src={staticFile(`/transitions-sfx/${sfx}`)} 
                      volume={theme.audio.sfxVolume} 
                    />
                  </Sequence>
                )}
              </TransitionSeries.Sequence>
            );

            if (isLast) return [sequence];

            return [
              sequence,
              <TransitionSeries.Transition
                key={`trans-${index}`}
                presentation={presentation}
                timing={linearTiming({ durationInFrames: transitionDuration })}
              />
            ];
          })}
        </TransitionSeries>
      </AbsoluteFill>
    </ThemeProvider>
  );
};