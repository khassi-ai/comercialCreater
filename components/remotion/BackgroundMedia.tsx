import React from "react";
import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame } from "remotion";

interface BackgroundMediaProps {
  bgUrl?: string;
  bgMode?: "video" | "image" | "custom";
  sceneIndex: number;
  durationInFrames: number;
  textPlacement?: "center" | "left" | "right";
}

export const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  bgUrl,
  bgMode = "image",
  sceneIndex,
  durationInFrames,
  textPlacement = "center",
}) => {
  const frame = useCurrentFrame();

  // シネマティックな Ken Burns（ゆっくりズーム・パン）効果
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  const panX = interpolate(
    frame,
    [0, durationInFrames],
    textPlacement === "left" ? [0, -20] : textPlacement === "right" ? [0, 20] : [0, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#090d16" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translateX(${panX}px)`,
          transformOrigin: textPlacement === "left" ? "80% 50%" : textPlacement === "right" ? "20% 50%" : "50% 50%",
        }}
      >
        {bgUrl ? (
          bgMode === "video" ? (
            <Video
              src={bgUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
              loop
            />
          ) : (
            <Img
              src={bgUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)",
            }}
          />
        )}
      </div>

      {/* 文字が確実にくっきり読める高コントラスト遮光オーバーレイ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            textPlacement === "left"
              ? "linear-gradient(90deg, rgba(10,14,24,0.92) 0%, rgba(10,14,24,0.7) 48%, rgba(10,14,24,0.15) 100%)"
              : textPlacement === "right"
              ? "linear-gradient(270deg, rgba(10,14,24,0.92) 0%, rgba(10,14,24,0.7) 48%, rgba(10,14,24,0.15) 100%)"
              : "radial-gradient(circle at center, rgba(10,14,24,0.65) 0%, rgba(10,14,24,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

