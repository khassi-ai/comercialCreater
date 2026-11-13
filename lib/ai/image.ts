import { GoogleGenAI } from "@google/genai";
import { AspectRatio, TextPlacement, VisualTheme } from "../types";

export interface GenerateSceneImageParams {
  bgPrompt: string;
  aspectRatio?: AspectRatio;
  textPlacement?: TextPlacement;
  visualTheme?: VisualTheme;
  sceneId?: number;
}

export async function generateSceneBackgroundImage({
  bgPrompt,
  aspectRatio = "16:9",
  textPlacement = "center",
  visualTheme = "dojo-scroll",
  sceneId = 1,
}: GenerateSceneImageParams): Promise<{ imageBuffer: Buffer; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const placementDirective =
    textPlacement === "left"
      ? "IMPORTANT: Keep the LEFT 45% of the image as clean, uncluttered, dark negative space for typography overlay. Main subjects on the right."
      : textPlacement === "right"
      ? "IMPORTANT: Keep the RIGHT 45% of the image as clean, uncluttered, dark negative space for typography overlay. Main subjects on the left."
      : "IMPORTANT: Keep the central area clean and softly lit with high contrast dark tones for text readability.";

  const fullPrompt = `${bgPrompt}. ${placementDirective}, ${
    aspectRatio === "9:16" ? "vertical 9:16 portrait" : "widescreen 16:9 landscape"
  }, cinematic lighting, photorealistic, high resolution, strictly no text, no letters, no characters, no watermark.`;

  const imageModels = [
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image",
  ];

  for (const model of imageModels) {
    try {
      console.log(`[Image scene ${sceneId}] Generating with ${model}...`);
      const res = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          responseModalities: ["IMAGE"],
        },
      });

      const parts = res.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData?.data);
      if (imgPart?.inlineData?.data) {
        const buf = Buffer.from(imgPart.inlineData.data, "base64");
        console.log(`[Image scene ${sceneId}] SUCCESS with ${model}: ${buf.length} bytes`);
        return {
          imageBuffer: buf,
          mimeType: imgPart.inlineData.mimeType || "image/png",
        };
      }
    } catch (err: any) {
      console.warn(`[Image scene ${sceneId}] ${model} failed: ${err.message}, trying next...`);
    }
  }

  throw new Error(`Failed to generate scene ${sceneId} image with all models`);
}

