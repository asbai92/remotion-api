import { z } from 'zod';

// 1) Mise à jour des layouts possibles
export const LayoutSchema = z.enum([
  'HERO',
  'CONCEPT',
  'SPLIT_TEXT_TOP',
  'SPLIT_MEDIA_TOP',
  'SPLIT_TEXT_LEFT',
  'SPLIT_MEDIA_LEFT',
  'GRID',
  'LIST',
  'TALKING_HEAD',
  'QUOTE',
  'COMPARISON',
  'DIAGRAM',
]);

// Schéma pour le contenu d'une scène
const SceneContentSchema = z.object({
  // --- Champs Textuels ---
  texte_principal: z.string().optional(),
  mots_cles: z.array(z.string()).optional(),
  titre: z.string().optional(),
  points: z.array(z.string()).optional(),
  citation: z.string().optional(),
  auteur: z.string().optional(),
  code: z.string().optional(),

  media: z.string().optional(), 
  medias: z.array(z.string()).optional(),
  video_source: z.string().optional(),
  
  // --- Champs Spécifiques (Split, Comparison) ---
  topContent: z.object({
    media: z.string().optional(),
    texte: z.string().optional(),
    mots_cles: z.array(z.string()).optional(),
  }).optional(),
  bottomContent: z.object({
    media: z.string().optional(),
    texte: z.string().optional(),
    mots_cles: z.array(z.string()).optional(),
  }).optional(),

  leftContent: z.object({
    media: z.string().optional(),
    texte: z.string().optional(),
    mots_cles: z.array(z.string()).optional(),
  }).optional(),
  rightContent: z.object({
    media: z.string().optional(),
    texte: z.string().optional(),
    mots_cles: z.array(z.string()).optional(),
  }).optional(),
  
  avant: z.string().optional(),
  apres: z.string().optional(),
});

export const SceneSchema = z.object({
  layout: LayoutSchema,
  audio_voix_off: z.string().optional(), 
  duree_vo: z.number(), 
  content: SceneContentSchema,
});

export const ProjectConfigSchema = z.object({
  config_globale: z.object({
    theme: z.string().default('dark_night'),
  }),
  scenes: z.array(SceneSchema),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type LayoutType = z.infer<typeof LayoutSchema>;