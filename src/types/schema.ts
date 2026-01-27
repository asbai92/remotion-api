import { z } from 'zod';

// Définition des layouts possibles
export const LayoutSchema = z.enum([
  'HERO',
  'CONCEPT',
  'SPLIT',
  'GRID',
  'LIST',
  'DEVICE',
  'TALKING_HEAD',
  'QUOTE',
  'COMPARISON',
]);

// Schéma pour le contenu d'une scène (flexible selon le layout)
const SceneContentSchema = z.object({
  texte_principal: z.string().optional(),
  mots_cles: z.array(z.string()).optional(),
  lottie: z.string().optional(),
  lotties: z.array(z.string()).optional(),
  titre: z.string().optional(),
  points: z.array(z.string()).optional(),
  cote_gauche: z.any().optional(),
  cote_droit: z.any().optional(),
  device: z.string().optional(),
  media: z.string().optional(),
  video_source: z.string().optional(),
  citation: z.string().optional(),
  auteur: z.string().optional(),
  avant: z.string().optional(),
  apres: z.string().optional(),
});

// Schéma d'une scène individuelle
export const SceneSchema = z.object({
  layout: LayoutSchema,
  audio_voix_off: z.string(),
  duree_vo: z.number(), // Durée en secondes
  content: SceneContentSchema,
});

// Schéma global de la configuration (le JSON complet)
export const ProjectConfigSchema = z.object({
  config_globale: z.object({
    theme: z.string().default('dark_night'),
  }),
  scenes: z.array(SceneSchema),
});

// Export des types TypeScript déduits du schéma
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type LayoutType = z.infer<typeof LayoutSchema>;