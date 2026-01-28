// src/components/TransitionManager.tsx
import { useMemo } from 'react';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { TRANSITION_SFX_MAP } from '../constants/assets';

const TRANSITIONS = [
  { name: 'slide', component: slide },
  { name: 'fade', component: fade },
  { name: 'wipe', component: wipe },
  { name: 'flip', component: flip },
];

export const useRandomTransition = () => {
  return useMemo(() => {
    const randomIndex = Math.floor(Math.random() * TRANSITIONS.length);
    const selected = TRANSITIONS[randomIndex];
    const sfx = TRANSITION_SFX_MAP[selected.name] || TRANSITION_SFX_MAP['generic'];

    return {
      // On retourne la fonction brute sans l'exécuter
      presentation: selected.component, 
      sfx: sfx,
      durationInFrames: 30,
    };
  }, []);
};