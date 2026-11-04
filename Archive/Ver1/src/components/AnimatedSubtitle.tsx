import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import { AspectRatio, CmTone } from "../types";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "900"],
});

interface AnimatedSubtitleProps {
  subtitle: string;
  aspectRatio: AspectRatio;
  durationInFrames: number;
  tone: CmTone;
}

const TONE_ACCENT_COLOR: Record<CmTone, string> = {
  passionate: "#f59e0b",
  smart: "#38bdf8",
  friendly: "#34d399",
};

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({
  subtitle,
  aspectRatio,
  durationInFrames,
  tone,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = aspectRatio === "9:16";
  const accentColor = TONE_ACCENT_COLOR[tone] || "#f59e0b";

  if (!subtitle || subtitle.trim().length === 0) {
    return null;
  }

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 180,
      mass: 0.6,
    },
  });

  const exitOpacity = interpolate(
    frame,
    [Math.max(10, durationInFrames - 8), Math.max(12, durationInFrames)],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const progressPercent = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [0, 100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: isPortrait ? 96 : 52,
        paddingLeft: isPortrait ? 36 : 80,
        paddingRight: isPortrait ? 36 : 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity: entrance * exitOpacity,
          transform: `translateY(${interpolate(entrance, [0, 1], [24, 0])}px)`,
          background: "rgba(6, 10, 22, 0.88)",
          backdropFilter: "blur(12px)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 20,
          padding: isPortrait ? "20px 32px 24px 32px" : "16px 44px 20px 44px",
          maxWidth: isPortrait ? "96%" : "86%",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: isPortrait ? 34 : 38,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.38,
            letterSpacing: "0.04em",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.85)",
          }}
        >
          {subtitle}
        </div>

        {/* Deterministic Audio-Synced Bottom Progress Bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 5,
            width: `${progressPercent}%`,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

