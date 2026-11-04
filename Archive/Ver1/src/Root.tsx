import React from "react";
import { Composition } from "remotion";
import { CmComposition } from "./CmComposition";
import { ScenarioData } from "./types";
import generatedProps from "./generated-props.json";

const defaultScenario = generatedProps as unknown as ScenarioData;

const computeTotalFrames = (props: ScenarioData): number => {
  if (!props?.scenes || props.scenes.length === 0) {
    return 600; // Default 20s @ 30fps
  }
  const sum = props.scenes.reduce(
    (acc, scene) => acc + Math.max(30, Math.round(scene.durationInFrames || 135)),
    0
  );
  return Math.max(60, sum);
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 横長CM (16:9 / 1920x1080) */}
      <Composition
        id="CmLandscape"
        component={CmComposition as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={computeTotalFrames(defaultScenario)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          ...defaultScenario,
          aspectRatio: "16:9",
        }}
        calculateMetadata={({ props }) => {
          const typedProps = props as unknown as ScenarioData;
          return {
            durationInFrames: computeTotalFrames(typedProps),
            fps: typedProps.fps || 30,
            width: 1920,
            height: 1080,
            props: {
              ...typedProps,
              aspectRatio: "16:9",
            },
          };
        }}
      />

      {/* 縦長ショートCM (9:16 / 1080x1920) */}
      <Composition
        id="CmPortrait"
        component={CmComposition as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={computeTotalFrames(defaultScenario)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultScenario,
          aspectRatio: "9:16",
        }}
        calculateMetadata={({ props }) => {
          const typedProps = props as unknown as ScenarioData;
          return {
            durationInFrames: computeTotalFrames(typedProps),
            fps: typedProps.fps || 30,
            width: 1080,
            height: 1920,
            props: {
              ...typedProps,
              aspectRatio: "9:16",
            },
          };
        }}
      />
    </>
  );
};

