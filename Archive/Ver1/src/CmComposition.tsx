import React from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ScenarioData, SceneData } from "./types";
import { BackgroundMedia } from "./components/BackgroundMedia";
import { ImpactHeading } from "./components/ImpactHeading";
import { AnimatedSubtitle } from "./components/AnimatedSubtitle";
import { InfoBoardScene } from "./components/InfoBoardScene";

const SceneTransitionFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const flashOpacity = interpolate(frame, [0, 5], [0.42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (flashOpacity <= 0.01) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#fef08a",
        opacity: flashOpacity,
        pointerEvents: "none",
      }}
    />
  );
};

interface SingleSceneProps {
  scene: SceneData;
  sceneIndex: number;
  totalScenes: number;
  scenario: ScenarioData;
}

const SingleSceneView: React.FC<SingleSceneProps> = ({
  scene,
  sceneIndex,
  totalScenes,
  scenario,
}) => {
  const isFinalScene =
    sceneIndex === totalScenes - 1 || Boolean(scene.infoBoard);
  const activeSubtitle =
    scenario.cmType === "evergreen" && scene.subtitleEvergreen
      ? scene.subtitleEvergreen
      : scenario.cmType === "dated" && scene.subtitleDated
      ? scene.subtitleDated
      : scene.subtitle;

  const visualTheme = scenario.visualTheme || "dojo-scroll";
  const textPlacement =
    scene.textPlacement ||
    (sceneIndex === 1 ? "left" : sceneIndex === 2 ? "right" : "center");
  const frameStyle =
    scene.frameStyle ||
    (visualTheme === "dojo-scroll"
      ? sceneIndex % 2 === 0
        ? "makimono"
        : "byobu"
      : "glass");

  return (
    <AbsoluteFill>
      {/* Dynamic Camera + Placement Contrast Shield + 30fps Particle Atmosphere */}
      <BackgroundMedia
        bgFile={scene.bgFile}
        bgMode={scene.bgMode}
        sceneIndex={sceneIndex}
        durationInFrames={scene.durationInFrames}
        tone={scenario.tone}
        visualTheme={visualTheme}
        textPlacement={isFinalScene ? "center" : textPlacement}
      />

      {/* Scene 1-3: Unrolling Scroll / Folding Screen / Impact Heading vs Scene 4: Information Board */}
      {isFinalScene ? (
        <InfoBoardScene
          heading={scene.heading}
          subBadge={scene.subBadge}
          infoBoard={scene.infoBoard}
          aspectRatio={scenario.aspectRatio}
          cmType={scenario.cmType}
          tone={scenario.tone}
          visualTheme={visualTheme}
          frameStyle={frameStyle}
        />
      ) : (
        <ImpactHeading
          heading={scene.heading}
          subBadge={scene.subBadge}
          role={scene.role}
          sceneNumber={sceneIndex + 1}
          aspectRatio={scenario.aspectRatio}
          tone={scenario.tone}
          visualTheme={visualTheme}
          textPlacement={textPlacement}
          frameStyle={frameStyle}
        />
      )}

      {/* Bottom Animated Subtitle */}
      <AnimatedSubtitle
        subtitle={activeSubtitle}
        aspectRatio={scenario.aspectRatio}
        durationInFrames={scene.durationInFrames}
        tone={scenario.tone}
      />

      {/* Audio Track (Frame-Accurate Synchronization) */}
      {scene.audioFile ? <Audio src={staticFile(scene.audioFile)} /> : null}

      {/* Cut Flash on Scene Entry */}
      {sceneIndex > 0 ? <SceneTransitionFlash /> : null}
    </AbsoluteFill>
  );
};

export const CmComposition: React.FC<ScenarioData> = (scenario) => {
  const scenes = scenario.scenes || [];

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <Series>
        {scenes.map((scene, index) => {
          const duration = Math.max(30, Math.round(scene.durationInFrames || 135));
          return (
            <Series.Sequence key={scene.id || index} durationInFrames={duration}>
              <SingleSceneView
                scene={scene}
                sceneIndex={index}
                totalScenes={scenes.length}
                scenario={scenario}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
