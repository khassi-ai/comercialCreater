import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadNotoSans } from "@remotion/google-fonts/NotoSansJP";
import { loadFont as loadNotoSerif } from "@remotion/google-fonts/NotoSerifJP";
import { loadFont as loadYujiSyuku } from "@remotion/google-fonts/YujiSyuku";
import { loadFont as loadDelaGothic } from "@remotion/google-fonts/DelaGothicOne";
import { loadFont as loadMochiyPop } from "@remotion/google-fonts/MochiyPopOne";
import {
  AspectRatio,
  CmTone,
  FrameStyle,
  TextPlacement,
  VisualTheme,
} from "../types";

const sansFont = loadNotoSans("normal", { weights: ["700", "900"] });
const serifFont = loadNotoSerif("normal", { weights: ["700", "900"] });
const brushFont = loadYujiSyuku("normal", { weights: ["400"] });
const delaFont = loadDelaGothic("normal", { weights: ["400"] });
const popFont = loadMochiyPop("normal", { weights: ["400"] });

interface ImpactHeadingProps {
  heading: string;
  subBadge?: string;
  role?: string;
  sceneNumber: number;
  aspectRatio: AspectRatio;
  tone: CmTone;
  visualTheme?: VisualTheme;
  textPlacement?: TextPlacement;
  frameStyle?: FrameStyle;
}

const KANJI_NUMS = ["壱", "弐", "参", "肆"];

export const ImpactHeading: React.FC<ImpactHeadingProps> = ({
  heading,
  subBadge,
  role,
  sceneNumber,
  aspectRatio,
  tone,
  visualTheme = "dojo-scroll",
  textPlacement = "center",
  frameStyle = "makimono",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = aspectRatio === "9:16";

  // Select font family based on visualTheme
  const activeFontFamily =
    visualTheme === "dojo-scroll"
      ? `${serifFont.fontFamily}, ${brushFont.fontFamily}, serif`
      : visualTheme === "cyber-impact"
      ? `${delaFont.fontFamily}, ${sansFont.fontFamily}, sans-serif`
      : visualTheme === "pop-campus"
      ? `${popFont.fontFamily}, ${sansFont.fontFamily}, sans-serif`
      : `${sansFont.fontFamily}, sans-serif`;

  // Effective placement (on 9:16 portrait, center is most balanced, with subtle left/right offset)
  const effectivePlacement: TextPlacement = isPortrait
    ? "center"
    : textPlacement || "center";

  const alignItemsStyle =
    effectivePlacement === "left"
      ? "flex-start"
      : effectivePlacement === "right"
      ? "flex-end"
      : "center";

  // Unroll / Entrance spring animations
  const mainSpring = spring({
    frame,
    fps,
    config: {
      damping: 13,
      stiffness: 135,
      mass: 0.85,
    },
  });

  const badgeSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: {
      damping: 12,
      stiffness: 170,
      mass: 0.75,
    },
  });

  const textRevealProgress = interpolate(frame, [5, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const charLen = heading.length;
  const isSidePlaced = effectivePlacement !== "center";
  const baseFontSize = isPortrait
    ? charLen > 14
      ? 60
      : charLen > 10
      ? 68
      : 78
    : isSidePlaced
    ? charLen > 14
      ? 66
      : charLen > 10
      ? 76
      : 86
    : charLen > 14
    ? 82
    : charLen > 10
    ? 94
    : 106;

  const kanjiNum = KANJI_NUMS[(sceneNumber - 1) % KANJI_NUMS.length];

  // ============================================================================
  // STYLE A: 📜 MAKIMONO (Japanese Unrolling Washi Scroll - Dark Ink on Parchment)
  // ============================================================================
  if (frameStyle === "makimono") {
    const unrollScaleX = interpolate(mainSpring, [0, 1], [0.08, 1]);
    const containerOpacity = interpolate(frame, [0, 5], [0, 1], {
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          fontFamily: activeFontFamily,
          display: "flex",
          flexDirection: "column",
          alignItems: alignItemsStyle,
          justifyContent: "center",
          padding: isPortrait
            ? "0 44px 180px 44px"
            : isSidePlaced
            ? "0 88px 130px 88px"
            : "0 96px 140px 96px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems:
              effectivePlacement === "left"
                ? "flex-start"
                : effectivePlacement === "right"
                ? "flex-end"
                : "center",
            maxWidth: isPortrait ? "98%" : isSidePlaced ? "58%" : "86%",
            width: "100%",
          }}
        >
          {/* Top Dojo Cut Role Tag */}
          {role && (
            <div
              style={{
                opacity: containerOpacity,
                transform: `translateY(${interpolate(mainSpring, [0, 1], [-18, 0])}px)`,
                marginBottom: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "linear-gradient(90deg, #7f1d1d 0%, #450a0a 100%)",
                border: "2px solid #f59e0b",
                borderRadius: 8,
                padding: "8px 24px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
              }}
            >
              <span
                style={{
                  fontFamily: brushFont.fontFamily,
                  background: "#f59e0b",
                  color: "#1c1917",
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "2px 12px",
                  borderRadius: 4,
                }}
              >
                {kanjiNum}之陣
              </span>
              <span
                style={{
                  color: "#fef3c7",
                  fontWeight: 900,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                }}
              >
                {role}
              </span>
            </div>
          )}

          {/* Unrolling Makimono Scroll Container */}
          <div
            style={{
              opacity: containerOpacity,
              transform: `scaleX(${unrollScaleX})`,
              transformOrigin:
                effectivePlacement === "left"
                  ? "left center"
                  : effectivePlacement === "right"
                  ? "right center"
                  : "center center",
              display: "flex",
              alignItems: "stretch",
              width: "100%",
              boxShadow:
                "0 28px 65px rgba(0, 0, 0, 0.78), 0 0 40px rgba(245, 158, 11, 0.35)",
              position: "relative",
            }}
          >
            {/* Left Scroll Wooden/Gold Roller Rod (軸棒) */}
            <div
              style={{
                width: isPortrait ? 26 : 30,
                background:
                  "linear-gradient(90deg, #451a03 0%, #92400e 45%, #fde047 75%, #451a03 100%)",
                borderRadius: "12px 0 0 12px",
                border: "2px solid #f59e0b",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.7)",
                flexShrink: 0,
                position: "relative",
              }}
            />

            {/* Washi Parchment Scroll Body (High-Contrast Light Background for Dark Sumi Text) */}
            <div
              style={{
                flex: 1,
                background:
                  "linear-gradient(180deg, #fdf8e8 0%, #f6e7c1 50%, #edd6a4 100%)",
                borderTop: "10px solid #991b1b",
                borderBottom: "10px solid #991b1b",
                padding: isPortrait
                  ? "34px 36px"
                  : isSidePlaced
                  ? "34px 44px"
                  : "38px 60px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              {/* Gold Inner Silk Line (錦縁の金線) */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #d97706, #fde047, #d97706)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #d97706, #fde047, #d97706)",
                }}
              />

              {/* Red Vermilion Seal Stamp (落款印) */}
              <div
                style={{
                  position: "absolute",
                  right: 22,
                  bottom: 18,
                  width: isPortrait ? 64 : 72,
                  height: isPortrait ? 64 : 72,
                  border: "3px solid rgba(185, 28, 28, 0.55)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(185, 28, 28, 0.55)",
                  fontFamily: brushFont.fontFamily,
                  fontSize: isPortrait ? 22 : 24,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  transform: "rotate(-8deg)",
                  pointerEvents: "none",
                }}
              >
                計算
                <br />
                道場
              </div>

              {/* Sumi-Ink Heading Text */}
              <div
                style={{
                  opacity: textRevealProgress,
                  transform: `translateY(${interpolate(
                    textRevealProgress,
                    [0, 1],
                    [14, 0]
                  )}px)`,
                  fontSize: baseFontSize,
                  fontWeight: 900,
                  color: "#17120e",
                  lineHeight: 1.22,
                  letterSpacing: "0.03em",
                  textShadow:
                    "0 2px 0 rgba(255, 255, 255, 0.8), 0 4px 12px rgba(120, 53, 15, 0.25)",
                  wordBreak: "keep-all",
                  overflowWrap: "anywhere",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {heading}
              </div>
            </div>

            {/* Right Scroll Wooden/Gold Roller Rod (軸棒) */}
            <div
              style={{
                width: isPortrait ? 26 : 30,
                background:
                  "linear-gradient(90deg, #451a03 0%, #fde047 25%, #92400e 55%, #451a03 100%)",
                borderRadius: "0 12px 12px 0",
                border: "2px solid #f59e0b",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.7)",
                flexShrink: 0,
              }}
            />
          </div>

          {/* Sub-badge (Crimson & Gold Wooden Plaque Style) */}
          {subBadge && subBadge.trim().length > 0 && (
            <div
              style={{
                marginTop: 24,
                opacity: interpolate(frame, [10, 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateY(${interpolate(
                  badgeSpring,
                  [0, 1],
                  [28, 0]
                )}px) scale(${interpolate(badgeSpring, [0, 1], [0.88, 1])})`,
                background: "linear-gradient(90deg, #991b1b 0%, #b91c1c 50%, #7f1d1d 100%)",
                border: "3px solid #fbbf24",
                borderRadius: 12,
                padding: isPortrait ? "14px 36px" : "14px 44px",
                boxShadow: "0 16px 35px rgba(0, 0, 0, 0.65)",
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 34, color: "#fde047" }}>❖</span>
              <span
                style={{
                  fontSize: isPortrait ? 36 : 40,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "0.05em",
                  textShadow: "0 3px 10px rgba(0, 0, 0, 0.6)",
                }}
              >
                {subBadge}
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // STYLE B: 🏯 BYOBU (Folding Screen & Black Lacquer Gold Plaque)
  // ============================================================================
  if (frameStyle === "byobu") {
    const foldRotateY = interpolate(mainSpring, [0, 1], [36, 0]);
    const foldScale = interpolate(mainSpring, [0, 1], [0.86, 1]);
    const containerOpacity = interpolate(frame, [0, 6], [0, 1], {
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          fontFamily: activeFontFamily,
          display: "flex",
          flexDirection: "column",
          alignItems: alignItemsStyle,
          justifyContent: "center",
          padding: isPortrait
            ? "0 44px 180px 44px"
            : isSidePlaced
            ? "0 88px 130px 88px"
            : "0 96px 140px 96px",
          perspective: 1200,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems:
              effectivePlacement === "left"
                ? "flex-start"
                : effectivePlacement === "right"
                ? "flex-end"
                : "center",
            maxWidth: isPortrait ? "98%" : isSidePlaced ? "58%" : "86%",
            width: "100%",
          }}
        >
          {/* Role Pill */}
          {role && (
            <div
              style={{
                opacity: containerOpacity,
                marginBottom: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(18, 14, 12, 0.92)",
                border: "2px solid #f59e0b",
                borderRadius: 8,
                padding: "8px 24px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.65)",
              }}
            >
              <span
                style={{
                  fontFamily: brushFont.fontFamily,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#1c1917",
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "2px 12px",
                  borderRadius: 4,
                }}
              >
                {kanjiNum}之陣
              </span>
              <span
                style={{
                  color: "#fde68a",
                  fontWeight: 900,
                  fontSize: 25,
                  letterSpacing: "0.08em",
                }}
              >
                {role}
              </span>
            </div>
          )}

          {/* Gold-Leaf & Black-Lacquer Folding Screen Plaque */}
          <div
            style={{
              opacity: containerOpacity,
              transform: `scale(${foldScale}) rotateY(${foldRotateY}deg)`,
              background:
                "linear-gradient(135deg, #f59e0b 0%, #fde047 35%, #b45309 70%, #fbbf24 100%)",
              padding: 8,
              borderRadius: 16,
              boxShadow:
                "0 28px 65px rgba(0, 0, 0, 0.82), 0 0 45px rgba(245, 158, 11, 0.45)",
              width: "100%",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(18, 14, 12, 0.96) 0%, rgba(32, 22, 18, 0.94) 55%, rgba(15, 12, 10, 0.97) 100%)",
                border: "2px solid rgba(253, 224, 71, 0.45)",
                borderRadius: 10,
                padding: isPortrait
                  ? "34px 36px"
                  : isSidePlaced
                  ? "34px 42px"
                  : "38px 58px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: baseFontSize,
                  fontWeight: 900,
                  color: "#fef9c3",
                  lineHeight: 1.24,
                  letterSpacing: "0.03em",
                  textShadow:
                    "0 4px 18px rgba(0, 0, 0, 0.95), 0 0 28px rgba(245, 158, 11, 0.65)",
                  wordBreak: "keep-all",
                  overflowWrap: "anywhere",
                }}
              >
                {heading}
              </div>
            </div>
          </div>

          {/* Sub-badge */}
          {subBadge && subBadge.trim().length > 0 && (
            <div
              style={{
                marginTop: 24,
                opacity: interpolate(frame, [10, 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                transform: `translateY(${interpolate(
                  badgeSpring,
                  [0, 1],
                  [28, 0]
                )}px)`,
                background: "linear-gradient(90deg, #b45309 0%, #d97706 50%, #92400e 100%)",
                border: "3px solid #fef08a",
                borderRadius: 10,
                padding: isPortrait ? "14px 36px" : "14px 44px",
                boxShadow: "0 16px 35px rgba(0, 0, 0, 0.65)",
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 34, color: "#fef08a" }}>✦</span>
              <span
                style={{
                  fontSize: isPortrait ? 36 : 40,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "0.05em",
                }}
              >
                {subBadge}
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // STYLE C: ✨ GLASS (Modern High-Contrast Frosted Glass Card)
  // ============================================================================
  const headingScale = interpolate(mainSpring, [0, 1], [1.28, 1]);
  const headingOpacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: activeFontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: alignItemsStyle,
        justifyContent: "center",
        padding: isPortrait
          ? "0 48px 180px 48px"
          : isSidePlaced
          ? "0 88px 130px 88px"
          : "0 96px 140px 96px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems:
            effectivePlacement === "left"
              ? "flex-start"
              : effectivePlacement === "right"
              ? "flex-end"
              : "center",
          maxWidth: isPortrait ? "96%" : isSidePlaced ? "58%" : "86%",
          width: "100%",
        }}
      >
        {role && (
          <div
            style={{
              opacity: headingOpacity,
              marginBottom: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(15, 23, 42, 0.88)",
              border: "2px solid rgba(56, 189, 248, 0.45)",
              borderRadius: 999,
              padding: "8px 26px",
            }}
          >
            <span
              style={{
                background: "#0284c7",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 22,
                padding: "2px 14px",
                borderRadius: 999,
              }}
            >
              POINT 0{sceneNumber}
            </span>
            <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: 24 }}>
              {role}
            </span>
          </div>
        )}

        <div
          style={{
            opacity: headingOpacity,
            transform: `scale(${headingScale})`,
            background: "rgba(9, 13, 28, 0.84)",
            backdropFilter: "blur(14px)",
            border: "3px solid rgba(255, 255, 255, 0.28)",
            borderRadius: 28,
            padding: isPortrait ? "34px 40px" : "34px 56px",
            boxShadow:
              "0 24px 60px rgba(0, 0, 0, 0.72), 0 0 40px rgba(56, 189, 248, 0.45)",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: baseFontSize,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.22,
              letterSpacing: "0.03em",
              textShadow: "0 6px 24px rgba(0, 0, 0, 0.9)",
            }}
          >
            {heading}
          </div>
        </div>

        {subBadge && subBadge.trim().length > 0 && (
          <div
            style={{
              marginTop: 24,
              opacity: interpolate(frame, [8, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${interpolate(
                badgeSpring,
                [0, 1],
                [28, 0]
              )}px)`,
              background:
                tone === "friendly"
                  ? "linear-gradient(90deg, #059669 0%, #0d9488 100%)"
                  : "linear-gradient(90deg, #0284c7 0%, #4f46e5 100%)",
              border: "3px solid #7dd3fc",
              borderRadius: 999,
              padding: "14px 44px",
              boxShadow: "0 16px 35px rgba(0, 0, 0, 0.55)",
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 36, color: "#ffffff" }}>✦</span>
            <span
              style={{
                fontSize: isPortrait ? 36 : 40,
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              {subBadge}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
