import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface InfoBoardProps {
  infoBoard?: {
    title: string;
    schedules: Array<{ label: string; date: string }>;
    ctaText: string;
  };
}

export const InfoBoardScene: React.FC<InfoBoardProps> = ({ infoBoard }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 100 },
  });

  if (!infoBoard) {
    return (
      <div
        style={{
          position: "absolute",
          bottom: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 15,
        }}
      >
        <div
          style={{
            padding: "20px 48px",
            backgroundColor: "#06c755",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(6,199,85,0.5)",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            今すぐ詳細をチェック！
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "45%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${entrance})`,
        width: "720px",
        backgroundColor: "rgba(17, 24, 39, 0.92)",
        border: "2px solid rgba(59, 130, 246, 0.4)",
        borderRadius: "24px",
        padding: "36px 44px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 30px rgba(37,99,235,0.3)",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#93c5fd",
          fontSize: "32px",
          fontWeight: 700,
          textAlign: "center",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {infoBoard.title}
      </h2>

      {infoBoard.schedules && infoBoard.schedules.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {infoBoard.schedules.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 20px",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 600 }}>
                {item.label}
              </span>
              <span style={{ color: "#60a5fa", fontSize: "22px", fontWeight: 700 }}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "8px",
          padding: "18px 32px",
          backgroundColor: "#06c755",
          borderRadius: "14px",
          textAlign: "center",
          boxShadow: "0 6px 20px rgba(6,199,85,0.4)",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "0.02em",
          }}
        >
          {infoBoard.ctaText || "今すぐエントリー！"}
        </span>
      </div>
    </div>
  );
};

