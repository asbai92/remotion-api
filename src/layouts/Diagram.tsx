import React, { useEffect, useState, useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile, Sequence } from 'remotion';
import mermaid from 'mermaid';
import { THEME } from '../constants/theme';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    fontFamily: THEME.typography.fontFamily,
    primaryColor: 'rgba(0, 0, 0, 0.7)',
    primaryBorderColor: THEME.colors.accent,
    primaryTextColor: '#ffffff',
    lineColor: THEME.colors.accent,
    fontSize: '24px',
  }
});

interface DiagramProps {
  content: {
    titre?: string;
    code?: string;
  };
  durationInSeconds?: number;
}

export const Diagram: React.FC<DiagramProps> = ({ content, durationInSeconds = 5 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [svg, setSvg] = useState<string>('');

  const incrementalCode = useMemo(() => {
    const fullCode = content.code || "";
    const lines = fullCode.split(';').filter(l => l.trim() !== "");
    const header = lines[0].includes('graph') ? lines[0] : 'graph TD';
    const instructions = lines[0].includes('graph') ? lines.slice(1) : lines;

    return instructions.map((_, i) => {
      return `${header}; linkStyle default stroke-width:8px; ${instructions.slice(0, i + 1).join(';')};`;
    });
  }, [content.code]);

  const totalFrames = durationInSeconds * fps;
  const availableFrames = totalFrames - 40; 
  const framesPerStep = Math.max(15, Math.floor(availableFrames / incrementalCode.length));

  // MODIFICATION : L'index commence à -1 pour ne rien afficher avant le premier son à la frame 20
  const currentStepIndex = frame < 20 
    ? -1 
    : Math.min(
        Math.floor((frame - 20) / framesPerStep),
        incrementalCode.length - 1
      );

  const soundTriggers = useMemo(() => {
    return incrementalCode.map((_, i) => 20 + (i * framesPerStep));
  }, [incrementalCode, framesPerStep]);

  useEffect(() => {
    const renderStep = async () => {
      // Si on est avant le premier déclenchement, on vide le SVG
      if (currentStepIndex === -1) {
        setSvg('');
        return;
      }

      const codeToRender = incrementalCode[currentStepIndex];
      if (codeToRender) {
        try {
          const { svg: renderedSvg } = await mermaid.render(`mermaid-svg-stable`, codeToRender);
          setSvg(renderedSvg);
        } catch (e) {
          console.error("Erreur Mermaid:", e);
        }
      }
    };
    renderStep();
  }, [currentStepIndex, incrementalCode]);

  const spr = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      
      {soundTriggers.map((fromFrame, index) => (
        <Sequence key={index} from={fromFrame}>
          <Audio
            src={staticFile("/sfx/pop.mp3")}
            playbackRate={1.2}
            volume={0.5}
          />
        </Sequence>
      ))}

      {content.titre && (
        <div style={{
          position: 'absolute', top: 80,
          fontFamily: THEME.typography.fontFamily,
          fontSize: THEME.typography.fontSize.title * 0.7,
          fontWeight: 900, color: 'white',
          textTransform: 'uppercase', 
          opacity: spr,
          textShadow: '0 5px 15px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          {content.titre}
        </div>
      )}

      <div 
        style={{
          width: '95%',
          height: '80%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // On n'affiche le conteneur que si on a un index valide
          opacity: currentStepIndex === -1 ? 0 : spr,
          transform: `scale(${interpolate(spr, [0, 1], [0.8, 1.2])})`,
        }}
      >
        <div 
          style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        svg { 
          width: 100% !important; 
          height: auto !important; 
        }
        .node rect { 
          stroke-width: 8px !important; 
          rx: 20px !important; 
          ry: 20px !important;
        }
        .edgePath path { 
          stroke-width: 8px !important; 
        }
        .marker {
          transform: scale(1.5);
        }
        .label { 
          font-weight: 900 !important;
          font-size: 28px !important;
          fill: white !important;
        }
      `}} />
    </AbsoluteFill>
  );
};