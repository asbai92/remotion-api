import { Composition } from 'remotion';
import { Main } from './Main';
import { ProjectConfigSchema, ProjectConfig } from './types/schema';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={Main}
        width={1920}
        height={1080}
        fps={30}
        schema={ProjectConfigSchema}
        calculateMetadata={({ props }) => {
          const fps = 30;
          const data = props as ProjectConfig;
          
          // Somme des durées
          const totalDurationSeconds = data.scenes?.reduce(
            (acc, scene) => acc + (scene.duree_vo || 0), 
            0
          ) || 5; // Par défaut 5s si vide

          return {
            durationInFrames: Math.floor(totalDurationSeconds * fps),
          };
        }}
        defaultProps={{
          config_globale: {
            theme: "youtube_videos"
          },
          scenes: []
        } as ProjectConfig}
      />
    </>
  );
};