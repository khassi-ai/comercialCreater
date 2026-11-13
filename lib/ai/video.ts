import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { generateSceneBackgroundImage } from "./image";

export async function generateSceneBackgroundMedia({
  bgPrompt,
  aspectRatio = "16:9",
  textPlacement = "center",
  sceneId = 1,
  tone = "passionate",
  outputPath,
}: {
  bgPrompt: string;
  aspectRatio?: "16:9" | "9:16";
  textPlacement?: "center" | "left" | "right";
  sceneId?: number;
  tone?: string;
  outputPath?: string;
}): Promise<{ mediaUrl: string; mode: "video" | "image" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const isLandscape = aspectRatio !== "9:16";

  const placementRule =
    textPlacement === "left"
      ? "LAYOUT: Left 50% must be clean, dark negative space for text overlay. Main visual subjects on the RIGHT 50%."
      : textPlacement === "right"
      ? "LAYOUT: Right 50% must be clean, dark negative space for text overlay. Main visual subjects on the LEFT 50%."
      : "LAYOUT: Center should be clean and dark with high contrast for text readability.";

  const videoPrompt = `${bgPrompt}. ${placementRule}, ${
    isLandscape ? "16:9 widescreen" : "9:16 vertical portrait"
  }, cinematic lighting, photorealistic high aesthetic motion video, smooth ambient camera drift, strictly no text, no characters, no subtitles, no watermark`;

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    // 1. AI Video Generation with gemini-omni-1.1-flash (Interactions API)
    try {
      console.log(`[Video scene ${sceneId}] Requesting AI video with gemini-omni-1.1-flash...`);
      if (ai.interactions?.create) {
        // タイムアウト20秒（待機が長くなりすぎないよう安全に設定）
        const interactionPromise = ai.interactions.create({
          model: "gemini-omni-1.1-flash",
          input: videoPrompt,
          response_format: {
            type: "video",
            aspect_ratio: isLandscape ? "16:9" : "9:16",
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Video generation timed out (20s)")), 20000)
        );

        const interaction = await Promise.race([interactionPromise, timeoutPromise]);
        const outputVideo = (interaction as any)?.output_video;
        if (outputVideo?.data && outputPath) {
          const buf = Buffer.from(outputVideo.data, "base64");
          fs.writeFileSync(outputPath, buf);
          console.log(`[Video scene ${sceneId}] AI video saved to ${outputPath} (${buf.length} bytes)`);
          return {
            mediaUrl: outputPath,
            mode: "video",
          };
        }
      }
    } catch (vidErr: any) {
      console.warn(`[Video scene ${sceneId}] Video generation fallback to high-res image:`, vidErr.message);
    }

    // 2. Fallback to fast photorealistic image with camera work
    try {
      console.log(`[Video scene ${sceneId}] Generating high-res keyframe image...`);
      const imgResult = await generateSceneBackgroundImage({
        bgPrompt,
        aspectRatio,
        textPlacement,
        sceneId,
      });

      if (outputPath) {
        const imagePath = outputPath.replace(/\.mp4$/, ".png");
        fs.writeFileSync(imagePath, imgResult.imageBuffer);
        return {
          mediaUrl: imagePath,
          mode: "image",
        };
      }
    } catch (imgErr: any) {
      console.warn(`[Video scene ${sceneId}] Keyframe image generation fallback:`, imgErr.message);
    }
  }

  // 3. プロシージャル背景（完全オフライン時）
  return {
    mediaUrl: `/generated/scene${(sceneId % 4) + 1}_bg.png`,
    mode: "image",
  };
}
