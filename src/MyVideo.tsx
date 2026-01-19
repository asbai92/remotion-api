import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

export const MyVideo: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation simple d'entrée (scale)
  const scale = spring({
    frame,
    fps,
    config: { damping: 10 },
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        fontSize: 100,
        fontWeight: 'bold',
        transform: `scale(${scale})`
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
