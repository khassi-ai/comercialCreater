import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ImpactHeadingProps {
  heading: string;
  subBadge?: string;
  textPlacement?: "center" | "left" | "right";
  isFinalScene?: boolean;
}

export const ImpactHeading: React.FC<ImpactHeadingProps> = ({
  heading,
  subBadge,
  textPlacement = "center",
  isFinalScene = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // スムーズな出現スプリングアニメーション
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  const translateY = interpolate(entrance, [0, 1], [40, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  const alignmentStyle: React.CSSProperties =
    textPlacement === "left"
      ? { left: "8%", textAlign: "left", alignItems: "flex-start" }
      : textPlacement === "right"
      ? { right: "8%", textAlign: "right", alignItems: "flex-end" }
      : { left: "50%", transform: `translateX(-50%) translateY(${translateY}px)`, textAlign: "center", alignItems: "center" };

  return (
    <div
      style={{
        position: "absolute",
        top: isFinalScene ? "18%" : "28%",
        maxWidth: "680px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        zIndex: 10,
        opacity,
        ...(textPlacement !== "center" ? { ...alignmentStyle, transform: `translateY(${translateY}px)` } : alignmentStyle),
      }}
    >
      {/* サブバッジ */}
      {subBadge && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "9999px",
            backgroundColor: "rgba(37, 99, 235, 0.9)",
            border: "1px solid rgba(147, 197, 253, 0.5)",
            boxShadow: "0 4px 16px rgba(37, 99, 235, 0.4)",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {subBadge}
          </span>
        </div>
      )}

      {/* インパクト見出し */}
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontSize: isFinalScene ? "56px" : "64px",
          fontWeight: 800,
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          textShadow: "0 4px 24px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)",
          fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
        }}
      >
        {heading}
      </h1>
    </div>
  );
};
