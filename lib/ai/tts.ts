import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

/**
 * 44バイトの RIFF WAV ヘッダーを作成する (16-bit mono PCM)
 */
export function createWavHeader(
  dataByteLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataByteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataByteLength, 40);

  return header;
}

/**
 * WAVバイナリから正確な再生秒数を計算する
 */
export function measureWavDuration(wavBuffer: Buffer): number {
  if (wavBuffer.length < 44) return 4.5;
  const riff = wavBuffer.toString("ascii", 0, 4);
  const wave = wavBuffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    return Math.max(1.0, wavBuffer.length / 48000);
  }

  let offset = 12;
  let byteRate = 48000;
  let dataBytes = wavBuffer.length - 44;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString("ascii", offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === "fmt " && offset + 20 <= wavBuffer.length) {
      const parsedByteRate = wavBuffer.readUInt32LE(offset + 16);
      if (parsedByteRate > 0) byteRate = parsedByteRate;
    } else if (chunkId === "data") {
      dataBytes = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return Math.max(1.0, Number((dataBytes / byteRate).toFixed(2)));
}

/**
 * ナレーション文字数から想定秒数を概算する (~6.5文字 = 1秒 + 余裕)
 */
export function estimateSecondsFromText(text: string): number {
  if (!text) return 4.5;
  const clean = text.replace(/\s+/g, "").length;
  const rawSec = clean / 6.5 + 0.45;
  return Number(Math.max(3.0, Math.min(8.0, rawSec)).toFixed(2));
}

/**
 * Gemini TTS またはモックで音声を合成し、WAVバッファと実測秒数を返す
 */
export async function synthesizeNarrationAudio({
  text,
  voiceType = "energetic",
  sceneId = 1,
}: {
  text: string;
  voiceType?: "energetic" | "professional" | "calm";
  sceneId?: number;
}): Promise<{ audioBase64: string; durationInSeconds: number; durationInFrames: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const voiceName =
    voiceType === "professional" ? "Aoede" : voiceType === "calm" ? "Charon" : "Puck";

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `以下の日本語文章を、広告動画のナレーションとしてハッキリと力強く、魅力的に読み上げてください。\n\n「${text}」`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash", // 最新の推奨モデル
        contents: prompt,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p: any) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) {
        const rawBuf = Buffer.from(audioPart.inlineData.data, "base64");
        let wavBuf: Buffer;
        if (rawBuf.length > 12 && rawBuf.toString("ascii", 0, 4) === "RIFF") {
          wavBuf = rawBuf;
        } else {
          // PCMにWAVヘッダー付与
          const padSamples = Math.round(24000 * 0.2);
          const padBuf = Buffer.alloc(padSamples * 2);
          const combined = Buffer.concat([rawBuf, padBuf]);
          const header = createWavHeader(combined.length, 24000, 1, 16);
          wavBuf = Buffer.concat([header, combined]);
        }
        const durationSec = measureWavDuration(wavBuf);
        return {
          audioBase64: `data:audio/wav;base64,${wavBuf.toString("base64")}`,
          durationInSeconds: durationSec,
          durationInFrames: Math.round(durationSec * 30),
        };
      }
    } catch (err) {
      console.warn(`Gemini TTS failed for scene ${sceneId}, using synthesized tone fallback:`, err);
    }
  }

  // フォールバック: 心地よいチャイム音の合成WAV
  const targetSec = estimateSecondsFromText(text);
  const sampleRate = 24000;
  const totalSamples = Math.round(targetSec * sampleRate);
  const pcmBuffer = Buffer.alloc(totalSamples * 2);

  const chords = [
    [523.25, 659.25, 783.99],
    [587.33, 739.99, 880.0],
    [659.25, 830.61, 987.77],
    [523.25, 659.25, 1046.5],
  ];
  const freqs = chords[(sceneId - 1) % chords.length];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < 0.6) {
      const env = Math.exp(-t * 5) * Math.min(1, t / 0.02);
      sample +=
        (Math.sin(2 * Math.PI * freqs[0] * t) * 0.4 +
          Math.sin(2 * Math.PI * freqs[1] * t) * 0.35 +
          Math.sin(2 * Math.PI * freqs[2] * t) * 0.25) *
        env *
        0.25;
    }
    const intSample = Math.max(-32767, Math.min(32767, Math.round(sample * 32767)));
    pcmBuffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(pcmBuffer.length, sampleRate, 1, 16);
  const wavBuf = Buffer.concat([header, pcmBuffer]);
  return {
    audioBase64: `data:audio/wav;base64,${wavBuf.toString("base64")}`,
    durationInSeconds: targetSec,
    durationInFrames: Math.round(targetSec * 30),
  };
}

