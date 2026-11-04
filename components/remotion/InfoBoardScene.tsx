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
import {
  AspectRatio,
  CmTone,
  CmType,
  FrameStyle,
  InfoBoardData,
  VisualTheme,
} from "@/lib/types";

const sansFont = loadNotoSans("normal", { weights: ["700", "900"] });
const serifFont = loadNotoSerif("normal", { weights: ["700", "900"] });
const brushFont = loadYujiSyuku("normal", { weights: ["400"] });

interface InfoBoardSceneProps {
  heading: string;
  subBadge?: string;
  infoBoard?: InfoBoardData;
  aspectRatio: AspectRatio;
  cmType: CmType;
  tone: CmTone;
  visualTheme?: VisualTheme;
  frameStyle?: FrameStyle;
}

const KANJI_ORDER = ["壱", "弐", "参", "肆"];

export const InfoBoardScene: React.FC<InfoBoardSceneProps> = ({
  heading,
  subBadge,
  infoBoard,
  aspectRatio,
  cmType,
  tone,
  visualTheme = "dojo-scroll",
  frameStyle = "byobu",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isPortrait = aspectRatio === "9:16";

  const isDojoStyle =
    visualTheme === "dojo-scroll" ||
    frameStyle === "byobu" ||
    frameStyle === "makimono";

  const activeFontFamily = isDojoStyle
    ? `${serifFont.fontFamily}, ${brushFont.fontFamily}, serif`
    : `${sansFont.fontFamily}, sans-serif`;

  const boardTitle = infoBoard?.title || heading || "イベント開催概要";
  const isEvergreen = cmType === "evergreen";

  const rawSchedules = isEvergreen
    ? infoBoard?.evergreenSchedules && infoBoard.evergreenSchedules.length > 0
      ? infoBoard.evergreenSchedules
      : ["毎月開催！最新スケジュールはWebへ", "次回の日程・詳細はフォームをチェック"]
    : infoBoard?.schedules && infoBoard.schedules.length > 0
    ? infoBoard.schedules
    : ["開催日程はWebページをご確認ください"];

  const locationText = infoBoard?.location || "CPAバーチャル校";
  const targetText = infoBoard?.target || "どなたでも参加歓迎！";
  const ctaText = isEvergreen
    ? infoBoard?.evergreenCtaText || infoBoard?.ctaText || "お申込みはフォームから ▶"
    : infoBoard?.ctaText || "今すぐお申込みフォームへ！";

  // Main Card Spring
  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 145, mass: 0.85 },
  });

  // Badges Spring
  const badgesSpring = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14, stiffness: 170, mass: 0.75 },
  });

  // CTA Button Spring & Continuous Pulse
  const ctaSpring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 11, stiffness: 180, mass: 0.7 },
  });
  const ctaPulse =
    frame > 28 ? 1 + Math.sin((frame - 28) * 0.22) * 0.025 : 1;

  // ============================================================================
  // DOJO BYOBU & WASHI SCROLL BOARD (金屏風＆和紙巻物 番付インフォボード)
  // ============================================================================
  if (isDojoStyle) {
    return (
      <AbsoluteFill
        style={{
          fontFamily: activeFontFamily,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isPortrait ? "64px 42px 170px 42px" : "34px 80px 120px 80px",
          pointerEvents: "none",
        }}
      >
        {/* Outer Gold Folding Screen Frame (金屏風外枠) */}
        <div
          style={{
            width: "100%",
            maxWidth: isPortrait ? 980 : 1460,
            opacity: interpolate(frame, [0, 7], [0, 1], {
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(
              cardSpring,
              [0, 1],
              [0.86, 1]
            )}) translateY(${interpolate(cardSpring, [0, 1], [36, 0])}px)`,
            background:
              "linear-gradient(135deg, #b45309 0%, #fde047 28%, #d97706 55%, #fef08a 80%, #92400e 100%)",
            padding: 10,
            borderRadius: isPortrait ? 24 : 22,
            boxShadow:
              "0 32px 75px rgba(0, 0, 0, 0.85), 0 0 55px rgba(245, 158, 11, 0.45)",
          }}
        >
          {/* Inner Lacquer & Washi Container */}
          <div
            style={{
              background:
                "linear-gradient(180deg, #1c1613 0%, #14100e 100%)",
              borderRadius: isPortrait ? 16 : 14,
              border: "2px solid rgba(253, 224, 71, 0.5)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Crimson & Gold Brocade Top Header (錦織ヘッダー) */}
            <div
              style={{
                background:
                  "linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)",
                padding: isPortrait ? "26px 34px" : "22px 44px",
                display: "flex",
                flexDirection: isPortrait ? "column" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: isPortrait ? 14 : 24,
                borderBottom: "4px solid #f59e0b",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isPortrait ? "center" : "flex-start",
                  textAlign: isPortrait ? "center" : "left",
                }}
              >
                <div
                  style={{
                    fontFamily: brushFont.fontFamily,
                    fontSize: isPortrait ? 24 : 23,
                    color: "#fde047",
                    letterSpacing: "0.12em",
                    marginBottom: 4,
                  }}
                >
                  {isEvergreen ? "❖ 常設道場 開催案内 ❖" : "❖ 道場開催 御触書（スケジュール） ❖"}
                </div>
                <div
                  style={{
                    fontSize: isPortrait ? 46 : 50,
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1.18,
                    letterSpacing: "0.04em",
                    textShadow: "0 4px 14px rgba(0, 0, 0, 0.65)",
                  }}
                >
                  {boardTitle}
                </div>
              </div>

              {/* Vermilion Seal Status Plaque */}
              <div
                style={{
                  background: "#fef3c7",
                  border: "3px solid #b45309",
                  borderRadius: 8,
                  padding: isPortrait ? "10px 26px" : "10px 28px",
                  fontSize: isPortrait ? 26 : 26,
                  fontWeight: 900,
                  color: "#991b1b",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
                  whiteSpace: "nowrap",
                }}
              >
                {subBadge || (isEvergreen ? "毎月定期開催中！" : "門下生・挑戦者募集中")}
              </div>
            </div>

            {/* Body Content */}
            <div
              style={{
                padding: isPortrait
                  ? "32px 34px 36px 34px"
                  : "28px 44px 34px 44px",
                display: "flex",
                flexDirection: "column",
                gap: isPortrait ? 26 : 22,
              }}
            >
              {/* 1. Washi Scroll Schedule Plaques (和紙巻物スケジュール枠) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    !isPortrait && rawSchedules.length > 1 ? "1fr 1fr" : "1fr",
                  gap: isPortrait ? 18 : 20,
                }}
              >
                {rawSchedules.map((item, idx) => {
                  const itemSpring = spring({
                    frame: Math.max(0, frame - (6 + idx * 4)),
                    fps,
                    config: { damping: 13, stiffness: 170, mass: 0.7 },
                  });

                  return (
                    <div
                      key={idx}
                      style={{
                        opacity: interpolate(
                          frame,
                          [5 + idx * 4, 11 + idx * 4],
                          [0, 1],
                          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                        ),
                        transform: `scaleX(${interpolate(
                          itemSpring,
                          [0, 1],
                          [0.2, 1]
                        )})`,
                        display: "flex",
                        alignItems: "stretch",
                        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.55)",
                      }}
                    >
                      {/* Left Scroll Rod */}
                      <div
                        style={{
                          width: 14,
                          background:
                            "linear-gradient(90deg, #451a03, #d97706, #451a03)",
                          borderRadius: "6px 0 0 6px",
                          border: "1px solid #fbbf24",
                        }}
                      />
                      {/* Washi Parchment Schedule Card (Dark Ink on Warm Washi) */}
                      <div
                        style={{
                          flex: 1,
                          background:
                            "linear-gradient(180deg, #fdf8e7 0%, #f5e5be 100%)",
                          borderTop: "5px solid #991b1b",
                          borderBottom: "5px solid #991b1b",
                          padding: isPortrait ? "20px 24px" : "18px 26px",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: brushFont.fontFamily,
                            background: "#991b1b",
                            color: "#fef08a",
                            borderRadius: 6,
                            padding: "6px 14px",
                            fontSize: isPortrait ? 26 : 24,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {isEvergreen
                            ? "常設"
                            : `${KANJI_ORDER[idx % KANJI_ORDER.length]}之陣`}
                        </div>
                        <div
                          style={{
                            fontSize: isPortrait ? 33 : 33,
                            fontWeight: 900,
                            color: "#17120e",
                            lineHeight: 1.25,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {item}
                        </div>
                      </div>
                      {/* Right Scroll Rod */}
                      <div
                        style={{
                          width: 14,
                          background:
                            "linear-gradient(90deg, #451a03, #d97706, #451a03)",
                          borderRadius: "0 6px 6px 0",
                          border: "1px solid #fbbf24",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 2. Location & Target Wooden Plaques (木札・黒漆バッジ) */}
              <div
                style={{
                  opacity: interpolate(frame, [12, 18], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  transform: `translateY(${interpolate(
                    badgesSpring,
                    [0, 1],
                    [24, 0]
                  )}px)`,
                  display: "grid",
                  gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
                  gap: isPortrait ? 18 : 20,
                }}
              >
                <div
                  style={{
                    background: "rgba(28, 22, 18, 0.95)",
                    border: "2px solid #f59e0b",
                    borderRadius: 12,
                    padding: isPortrait ? "18px 24px" : "16px 26px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 36 }}>📍</span>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#fbbf24",
                        letterSpacing: "0.08em",
                      }}
                    >
                      開催道場（場所）
                    </div>
                    <div
                      style={{
                        fontSize: isPortrait ? 30 : 30,
                        fontWeight: 900,
                        color: "#fef3c7",
                      }}
                    >
                      {locationText}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(28, 22, 18, 0.95)",
                    border: "2px solid #f59e0b",
                    borderRadius: 12,
                    padding: isPortrait ? "18px 24px" : "16px 26px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span style={{ fontSize: 36 }}>🔰</span>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#fbbf24",
                        letterSpacing: "0.08em",
                      }}
                    >
                      対象者
                    </div>
                    <div
                      style={{
                        fontSize: isPortrait ? 30 : 30,
                        fontWeight: 900,
                        color: "#fef3c7",
                      }}
                    >
                      {targetText}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Crimson & Gold CTA Banner */}
              <div
                style={{
                  opacity: interpolate(frame, [18, 24], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  transform: `scale(${
                    interpolate(ctaSpring, [0, 1], [0.88, 1]) * ctaPulse
                  })`,
                  background:
                    "linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)",
                  border: "3px solid #fde047",
                  borderRadius: 14,
                  padding: isPortrait ? "20px 36px" : "18px 46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  boxShadow:
                    "0 16px 40px rgba(0, 0, 0, 0.65), 0 0 30px rgba(245, 158, 11, 0.5)",
                }}
              >
                <span
                  style={{
                    fontSize: isPortrait ? 36 : 38,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "0.05em",
                    textShadow: "0 3px 10px rgba(0, 0, 0, 0.6)",
                  }}
                >
                  {ctaText}
                </span>
                <span
                  style={{
                    background: "#fde047",
                    color: "#7f1d1d",
                    borderRadius: 999,
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  ▶
                </span>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ============================================================================
  // MODERN GLASS BOARD (Cyber / Corporate / Pop Themes)
  // ============================================================================
  const headerGradient =
    tone === "friendly"
      ? "linear-gradient(90deg, #059669 0%, #0d9488 50%, #0284c7 100%)"
      : "linear-gradient(90deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)";

  return (
    <AbsoluteFill
      style={{
        fontFamily: activeFontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isPortrait ? "64px 42px 170px 42px" : "36px 84px 120px 84px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isPortrait ? 980 : 1440,
          opacity: interpolate(frame, [0, 8], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `scale(${interpolate(
            cardSpring,
            [0, 1],
            [0.88, 1]
          )}) translateY(${interpolate(cardSpring, [0, 1], [40, 0])}px)`,
          background: "rgba(10, 15, 32, 0.88)",
          backdropFilter: "blur(20px)",
          borderRadius: 32,
          border: "3px solid rgba(255, 255, 255, 0.28)",
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.78)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: headerGradient,
            padding: isPortrait ? "28px 36px" : "24px 48px",
            display: "flex",
            flexDirection: isPortrait ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: isPortrait ? 46 : 50,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            {boardTitle}
          </div>
          <div
            style={{
              background: "rgba(0, 0, 0, 0.35)",
              border: "2px solid rgba(255, 255, 255, 0.45)",
              borderRadius: 999,
              padding: "10px 28px",
              fontSize: 25,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            {subBadge || (isEvergreen ? "毎月定期開催中！" : "参加エントリー受付中")}
          </div>
        </div>

        <div
          style={{
            padding: isPortrait ? "34px" : "32px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                !isPortrait && rawSchedules.length > 1 ? "1fr 1fr" : "1fr",
              gap: 18,
            }}
          >
            {rawSchedules.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(30, 41, 59, 0.92)",
                  border: "2px solid rgba(255, 255, 255, 0.22)",
                  borderRadius: 18,
                  padding: "20px 26px",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#ffffff",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPortrait ? "1fr" : "1fr 1fr",
              gap: 18,
            }}
          >
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "2px solid rgba(56, 189, 248, 0.45)",
                borderRadius: 18,
                padding: "16px 26px",
                fontSize: 29,
                fontWeight: 900,
                color: "#f8fafc",
              }}
            >
              📍 {locationText}
            </div>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: "2px solid rgba(52, 211, 153, 0.45)",
                borderRadius: 18,
                padding: "16px 26px",
                fontSize: 29,
                fontWeight: 900,
                color: "#f8fafc",
              }}
            >
              🔰 {targetText}
            </div>
          </div>

          <div
            style={{
              transform: `scale(${ctaPulse})`,
              background: "linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)",
              border: "3px solid #fef08a",
              borderRadius: 999,
              padding: "18px 46px",
              textAlign: "center",
              fontSize: 38,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            {ctaText} ▶
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
