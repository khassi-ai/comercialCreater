import { GoogleGenAI } from "@google/genai";

export async function generateSceneBackgroundMedia({
  bgPrompt,
  aspectRatio = "16:9",
  textPlacement = "center",
  sceneId = 1,
  tone = "passionate",
}: {
  bgPrompt: string;
  aspectRatio?: "16:9" | "9:16";
  textPlacement?: "center" | "left" | "right";
  sceneId?: number;
  tone?: string;
}): Promise<{ mediaUrl: string; mode: "video" | "image" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isLandscape = aspectRatio !== "9:16";

  const placementRule =
    textPlacement === "left"
      ? "LAYOUT: Left 50% must be clean, uncluttered, dark high-contrast negative space for typography. All main visual subjects and glowing elements on the RIGHT 50%."
      : textPlacement === "right"
      ? "LAYOUT: Right 50% must be clean, uncluttered, dark high-contrast negative space for typography. All main visual subjects on the LEFT 50%."
      : "LAYOUT: Center should have balanced soft lighting and deep contrasting tones for central text panel.";

  const fullPrompt = `${bgPrompt}. ${placementRule}, ${
    isLandscape ? "16:9 widescreen" : "9:16 vertical portrait"
  }, cinematic lighting, 4k high aesthetic, strictly no text, no characters, no subtitles, no watermark`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      // 画像または動画生成の試行 (Gemini Flash Image / Imagen)
      const res = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Generate a visually stunning background video thumbnail or keyframe: ${fullPrompt}`,
      });

      const parts = res.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        return {
          mediaUrl: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${
            imagePart.inlineData.data
          }`,
          mode: "image",
        };
      }
    } catch (err) {
      console.warn(`AI Background generation fallback for scene ${sceneId}:`, err);
    }
  }

  // 美しいプロシージャル・グラデーション背景（フォールバック）
  // 16:9 のシネマティックな暗色グラデーション
  const gradients = [
    "linear-gradient(135deg, #0d1322 0%, #172554 50%, #1e1b4b 100%)", // Scene 1: 深紺・ブルー
    "linear-gradient(135deg, #180d24 0%, #311042 50%, #1c1917 100%)", // Scene 2: プレミアムパープル
    "linear-gradient(135deg, #0a1f1c 0%, #064e3b 50%, #022c22 100%)", // Scene 3: エメラルド
    "linear-gradient(135deg, #1c1917 0%, #451a03 50%, #1e1b4b 100%)", // Scene 4: アンバー・ゴールド
  ];
  const bgGrad = gradients[(sceneId - 1) % gradients.length];

  // SVG Data URLを生成
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="glow" cx="${textPlacement === 'left' ? '75%' : textPlacement === 'right' ? '25%' : '50%'}" cy="50%" r="60%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="50%" stop-color="#141a29"/>
        <stop offset="100%" stop-color="#0b0f19"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/>
    <circle cx="${textPlacement === 'left' ? 1400 : textPlacement === 'right' ? 520 : 960}" cy="540" r="480" fill="url(#glow)"/>
    <circle cx="${textPlacement === 'left' ? 1200 : 720}" cy="300" r="260" fill="#2563eb" opacity="0.12" filter="blur(60px)"/>
  </svg>`;

  const svgBase64 = Buffer.from(svg).toString("base64");
  return {
    mediaUrl: `data:image/svg+xml;base64,${svgBase64}`,
    mode: "image",
  };
}

