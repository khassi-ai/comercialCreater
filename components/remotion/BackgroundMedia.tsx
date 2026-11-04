import React from "react";
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { BgMode, CmTone, TextPlacement, VisualTheme } from "@/lib/types";

const resolveMediaUrl = (file?: string): string => {
  if (!file) return "";
  if (
    file.startsWith("http://") ||
    file.startsWith("https://") ||
    file.startsWith("data:")
  ) {
    return file;
  }
  return file.startsWith("/") ? file : `/${file}`;
};

interface BackgroundMediaProps {
  bgFile?: string;
  bgMode: BgMode;
  sceneIndex: number;
  durationInFrames: number;
  tone: CmTone;
  visualTheme?: VisualTheme;
  textPlacement?: TextPlacement;
}

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #1c1917 0%, #3b0764 50%, #0f172a 100%)",
  "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #090d16 100%)",
  "linear-gradient(135deg, #18181b 0%, #450a0a 50%, #090d16 100%)",
  "linear-gradient(135deg, #1c1917 0%, #422006 50%, #090d16 100%)",
];

// Deterministic pseudo-random helper for particle positions
const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  bgFile,
  bgMode,
  sceneIndex,
  durationInFrames,
  tone,
  visualTheme = "dojo-scroll",
  textPlacement = "center",
}) => {
  const frame = useCurrentFrame();
  const safeDuration = Math.max(durationInFrames, 30);

  // Dynamic camera movement (pan & zoom) coordinated with textPlacement
  const isZoomIn = sceneIndex % 2 === 0;
  const scale = interpolate(
    frame,
    [0, safeDuration],
    isZoomIn ? [1.04, 1.2] : [1.2, 1.04],
    { extrapolateRight: "clamp" }
  );

  const panX = interpolate(
    frame,
    [0, safeDuration],
    textPlacement === "left"
      ? [-24, 18]
      : textPlacement === "right"
      ? [24, -18]
      : sceneIndex % 2 === 0
      ? [-20, 20]
      : [20, -20],
    { extrapolateRight: "clamp" }
  );

  const panY = interpolate(
    frame,
    [0, safeDuration],
    sceneIndex < 2 ? [-14, 14] : [14, -14],
    { extrapolateRight: "clamp" }
  );

  const isVideoFile = Boolean(
    bgFile &&
      (bgFile.toLowerCase().endsWith(".mp4") ||
        bgFile.toLowerCase().endsWith(".webm"))
  );

  // Placement-aware high-contrast directional overlay so text area is always clean & legible
  // while keeping the AI-generated background video vivid on the subject side
  const placementOverlay =
    textPlacement === "left"
      ? "linear-gradient(90deg, rgba(6, 8, 18, 0.85) 0%, rgba(8, 10, 22, 0.65) 42%, rgba(8, 10, 22, 0.16) 68%, rgba(8, 10, 22, 0.04) 100%)"
      : textPlacement === "right"
      ? "linear-gradient(270deg, rgba(6, 8, 18, 0.85) 0%, rgba(8, 10, 22, 0.65) 42%, rgba(8, 10, 22, 0.16) 68%, rgba(8, 10, 22, 0.04) 100%)"
      : "radial-gradient(circle at 50% 44%, rgba(8, 10, 20, 0.48) 0%, rgba(8, 10, 20, 0.62) 68%, rgba(4, 6, 14, 0.80) 100%)";

  // Sweeping light beam animation
  const sweepPos = interpolate(frame, [0, safeDuration], [-35, 135]);

  // 32 deterministic animated particles (gold leaf flakes / sparks / bokeh orbs)
  const particles = React.useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const seed = (sceneIndex + 1) * 100 + i;
      return {
        id: i,
        baseX: pseudoRandom(seed) * 100,
        baseY: pseudoRandom(seed + 17) * 100,
        size: 6 + pseudoRandom(seed + 31) * 16,
        speedY: 0.22 + pseudoRandom(seed + 47) * 0.45,
        swayAmp: 12 + pseudoRandom(seed + 61) * 28,
        swayFreq: 0.04 + pseudoRandom(seed + 79) * 0.06,
        phase: pseudoRandom(seed + 97) * Math.PI * 2,
        isGoldLeaf: i % 3 !== 0,
      };
    });
  }, [sceneIndex]);

  const isDojo = visualTheme === "dojo-scroll";
  const isCyber = visualTheme === "cyber-impact";

  return (
    <AbsoluteFill
      style={{
        background: FALLBACK_GRADIENTS[sceneIndex % FALLBACK_GRADIENTS.length],
        overflow: "hidden",
      }}
    >
      {/* 1. Moving Camera Background Media */}
      {bgFile ? (
        <AbsoluteFill
          style={{
            transform: isVideoFile
              ? "scale(1.03)"
              : `scale(${scale}) translate(${panX}px, ${panY}px)`,
            transformOrigin: "center center",
          }}
        >
          {isVideoFile ? (
            <Video
              src={resolveMediaUrl(bgFile)}
              muted
              loop
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Img
              src={resolveMediaUrl(bgFile)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
        </AbsoluteFill>
      ) : null}

      {/* 2. Placement-Aware Directional Contrast Shield (protects text readability) */}
      <AbsoluteFill
        style={{
          background: placementOverlay,
        }}
      />

      {/* 3. Animated Diagonal Light Sweep */}
      <AbsoluteFill
        style={{
          background: isDojo
            ? `linear-gradient(115deg, transparent ${sweepPos - 18}%, rgba(251, 191, 36, 0.16) ${sweepPos}%, transparent ${sweepPos + 18}%)`
            : `linear-gradient(115deg, transparent ${sweepPos - 18}%, rgba(56, 189, 248, 0.14) ${sweepPos}%, transparent ${sweepPos + 18}%)`,
          pointerEvents: "none",
        }}
      />

      {/* 4. Continuous 30fps Particle & Atmosphere Motion Layer */}
      <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
        {particles.map((p) => {
          const yPos =
            ((p.baseY - frame * p.speedY) % 110 + 110) % 110 - 5;
          const xOffset = Math.sin(frame * p.swayFreq + p.phase) * p.swayAmp;
          const rot = frame * (p.isGoldLeaf ? 3.2 : 1.5) + p.id * 25;
          const pulseOpacity =
            0.35 + 0.45 * Math.abs(Math.sin(frame * 0.06 + p.phase));

          if (isDojo) {
            // Gold-leaf flakes (金箔) & rising dojo sparks (火花)
            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.baseX}%`,
                  top: `${yPos}%`,
                  width: p.isGoldLeaf ? p.size : p.size * 0.65,
                  height: p.isGoldLeaf ? p.size * 0.72 : p.size * 0.65,
                  opacity: pulseOpacity,
                  transform: `translateX(${xOffset}px) rotate(${rot}deg)`,
                  borderRadius: p.isGoldLeaf ? "3px" : "999px",
                  background: p.isGoldLeaf
                    ? "linear-gradient(135deg, #fef08a 0%, #f59e0b 60%, #b45309 100%)"
                    : "radial-gradient(circle, #fca5a5 0%, #ef4444 70%, transparent 100%)",
                  boxShadow: p.isGoldLeaf
                    ? "0 0 12px rgba(251, 191, 36, 0.75)"
                    : "0 0 14px rgba(239, 68, 68, 0.85)",
                }}
              />
            );
          }

          if (isCyber) {
            // Cyber neon data streaks
            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.baseX}%`,
                  top: `${yPos}%`,
                  width: 3,
                  height: p.size * 2.5,
                  opacity: pulseOpacity * 0.85,
                  transform: `translateX(${xOffset * 0.4}px)`,
                  borderRadius: 999,
                  background:
                    p.id % 2 === 0
                      ? "linear-gradient(180deg, #38bdf8, transparent)"
                      : "linear-gradient(180deg, #f43f5e, transparent)",
                  boxShadow: "0 0 10px rgba(56, 189, 248, 0.8)",
                }}
              />
            );
          }

          // Default Bokeh Orbs
          return (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.baseX}%`,
                top: `${yPos}%`,
                width: p.size * 1.6,
                height: p.size * 1.6,
                opacity: pulseOpacity * 0.45,
                transform: `translateX(${xOffset}px)`,
                borderRadius: "999px",
                background:
                  tone === "friendly"
                    ? "radial-gradient(circle, rgba(52, 211, 153, 0.7) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(125, 211, 252, 0.7) 0%, transparent 70%)",
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* 5. Top and Bottom Broadcast Vignette for Subtitle Clarity */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.82) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
