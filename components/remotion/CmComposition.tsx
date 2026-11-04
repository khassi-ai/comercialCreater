import React from "react";
import { AbsoluteFill, Audio, Series, interpolate, useCurrentFrame } from "remotion";
import { ScenarioData, SceneData } from "../../lib/types";
import { BackgroundMedia } from "./BackgroundMedia";
import { ImpactHeading } from "./ImpactHeading";
import { AnimatedSubtitle } from "./AnimatedSubtitle";
import { InfoBoardScene } from "./InfoBoardScene";

const SceneTransitionFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const flashOpacity = interpolate(frame, [0, 5], [0.4, 0], {
    extrapolateRight: "clamp",
  });
  if (flashOpacity <= 0.01) return null;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
        opacity: flashOpacity,
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
};

interface SingleSceneProps {
  scene: SceneData;
  sceneIndex: number;
  totalScenes: number;
}

const SingleSceneView: React.FC<SingleSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
}) => {
  const isFinalScene = sceneIndex === totalScenes - 1;

  return (
    <AbsoluteFill>
      <BackgroundMedia
        bgUrl={scene.bgUrl}
        bgMode={scene.bgMode}
        sceneIndex={sceneIndex}
        durationInFrames={scene.durationInFrames}
        textPlacement={scene.textPlacement}
      />

      <ImpactHeading
        heading={scene.heading}
        subBadge={scene.subBadge}
        textPlacement={scene.textPlacement}
        isFinalScene={isFinalScene}
      />

      {isFinalScene && scene.infoBoard ? (
        <InfoBoardScene infoBoard={scene.infoBoard} />
      ) : (
        <AnimatedSubtitle
          subtitle={scene.subtitle}
          durationInFrames={scene.durationInFrames}
        />
      )}

      {scene.audioUrl && <Audio src={scene.audioUrl} />}

      {sceneIndex > 0 && <SceneTransitionFlash />}
    </AbsoluteFill>
  );
};

export const CmComposition: React.FC<{ scenario: ScenarioData }> = ({
  scenario,
}) => {
  const scenes = scenario.scenes || [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Series>
        {scenes.map((scene, idx) => (
          <Series.Sequence
            key={scene.id || idx}
            durationInFrames={Math.max(30, scene.durationInFrames || 135)}
          >
            <SingleSceneView
              scene={scene}
              sceneIndex={idx}
              totalScenes={scenes.length}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
