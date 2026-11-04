import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface AnimatedSubtitleProps {
  subtitle: string;
  durationInFrames: number;
}

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({
  subtitle,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // フェードイン＆フェードアウト
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translateY = interpolate(frame, [0, 8], [15, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "8%",
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        maxWidth: "85%",
        zIndex: 20,
        opacity,
      }}
    >
      <div
        style={{
          padding: "16px 36px",
          backgroundColor: "rgba(10, 14, 24, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "16px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: 600,
            textAlign: "center",
            letterSpacing: "0.02em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};

