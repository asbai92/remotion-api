import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { MyVideo } from './MyVideo';

registerRoot(() => {
  return (
    <>
      <Composition
        id="HelloWorld" 
        component={MyVideo}
        durationInFrames={150} // 5 secondes à 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: "Texte par défaut"
        }}
      />
    </>
  );
});
