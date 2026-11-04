import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCENARIO_PATH = path.join(ROOT_DIR, "scenario.json");
const GENERATED_PROPS_PATH = path.join(ROOT_DIR, "src", "generated-props.json");
const GENERATED_DIR = path.join(ROOT_DIR, "public", "generated");

/**
 * Dynamically resolve GEMINI_API_KEY from .env, .env.local, or .env.example on disk
 * so edits take effect immediately without requiring a server restart.
 */
export function resolveGeminiApiKey() {
  const candidates = [
    path.join(ROOT_DIR, ".env"),
    path.join(ROOT_DIR, ".env.local"),
    path.join(ROOT_DIR, ".env.example"),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        const raw = fs.readFileSync(envPath, "utf-8");
        const parsed = dotenv.parse(raw);
        const key = (parsed.GEMINI_API_KEY || "")
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key && key !== "your_api_key_here") {
          process.env.GEMINI_API_KEY = key;
          return key;
        }
      } catch {
        // Ignore read/parse errors
      }
    }
  }

  const envKey = (process.env.GEMINI_API_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (envKey && envKey !== "your_api_key_here") {
    return envKey;
  }
  return "";
}

/**
 * Create a 44-byte RIFF WAV header for 16-bit mono PCM audio
 */
export function createWavHeader(dataByteLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataByteLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
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
 * Measure exact playback duration (in seconds) from a WAV file's byte length & header
 */
export function measureWavDurationSeconds(wavFilePath) {
  const buf = fs.readFileSync(wavFilePath);
  if (buf.length < 44) {
    return 4.5;
  }

  const riff = buf.toString("ascii", 0, 4);
  const wave = buf.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    // Fallback assuming 24kHz 16-bit mono (48,000 bytes/sec)
    return buf.length / 48000;
  }

  let offset = 12;
  let byteRate = 48000;
  let dataBytes = buf.length - 44;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === "fmt " && offset + 20 <= buf.length) {
      const parsedByteRate = buf.readUInt32LE(offset + 16);
      if (parsedByteRate > 0) byteRate = parsedByteRate;
    } else if (chunkId === "data") {
      dataBytes = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return Math.max(1.0, dataBytes / byteRate);
}

/**
 * Estimate target duration in seconds from narration text length
 * (~6.5 chars = 1s + ~0.4s natural pause margin)
 */
export function estimateSecondsFromText(text, fallbackSeconds = 4.5) {
  if (!text || typeof text !== "string") return fallbackSeconds;
  const cleanLen = text.replace(/\s+/g, "").length;
  const rawSec = cleanLen / 6.5 + 0.45;
  return Number(Math.max(3.2, Math.min(8.5, rawSec)).toFixed(2));
}

/**
 * Generate a pleasant synthetic chime + narration cadence WAV file for mock/test mode
 */
export function generateMockWavFile(outputPath, targetSeconds, sceneId = 1) {
  const sampleRate = 24000;
  const totalSamples = Math.max(sampleRate, Math.round(targetSeconds * sampleRate));
  const pcmBuffer = Buffer.alloc(totalSamples * 2);

  // Scene-specific pleasant chord frequencies (Hz)
  const chordSets = [
    [523.25, 659.25, 783.99], // Scene 1: C5 major triad
    [587.33, 739.99, 880.0],  // Scene 2: D5 major triad
    [659.25, 830.61, 987.77], // Scene 3: E5 major triad
    [523.25, 659.25, 1046.5], // Scene 4: C5-E5-C6 resolution
  ];
  const freqs = chordSets[(sceneId - 1) % chordSets.length];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Soft entrance chime over first 0.65 seconds
    let sample = 0;
    if (t < 0.7) {
      const env = Math.exp(-t * 5.5) * Math.min(1, t / 0.015);
      sample +=
        (Math.sin(2 * Math.PI * freqs[0] * t) * 0.4 +
          Math.sin(2 * Math.PI * freqs[1] * t) * 0.35 +
          Math.sin(2 * Math.PI * freqs[2] * t) * 0.25) *
        env *
        0.22;
    }

    // Subtle soft tick every 0.5s to verify frame-accurate audio sync
    const beatPhase = t % 0.5;
    if (beatPhase < 0.04 && t > 0.4 && t < targetSeconds - 0.3) {
      const beatEnv = Math.exp(-beatPhase * 90);
      sample += Math.sin(2 * Math.PI * 440 * t) * beatEnv * 0.035;
    }

    const intSample = Math.max(-32767, Math.min(32767, Math.round(sample * 32767)));
    pcmBuffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(pcmBuffer.length, sampleRate, 1, 16);
  fs.writeFileSync(outputPath, Buffer.concat([header, pcmBuffer]));
}

/**
 * Pure Node.js CRC32 implementation for valid PNG chunk generation
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Generate a rich procedural cinematic background PNG in pure Node.js (zero native deps)
 */
export function generateMockPngFile(outputPath, sceneId = 1, tone = "passionate") {
  const width = 640;
  const height = 360;

  // Color palettes per scene & tone
  const palettes = {
    passionate: [
      { top: [28, 18, 68], bottom: [98, 22, 48], glow: [245, 158, 11] },
      { top: [15, 28, 65], bottom: [38, 78, 130], glow: [56, 189, 248] },
      { top: [42, 14, 38], bottom: [110, 28, 36], glow: [239, 68, 68] },
      { top: [16, 36, 58], bottom: [48, 24, 78], glow: [250, 204, 21] },
    ],
    smart: [
      { top: [10, 22, 52], bottom: [22, 65, 118], glow: [56, 189, 248] },
      { top: [14, 30, 62], bottom: [30, 82, 135], glow: [125, 211, 252] },
      { top: [18, 24, 58], bottom: [48, 52, 125], glow: [99, 102, 241] },
      { top: [12, 34, 68], bottom: [20, 78, 110], glow: [45, 212, 191] },
    ],
    friendly: [
      { top: [12, 42, 48], bottom: [22, 88, 76], glow: [52, 211, 153] },
      { top: [16, 38, 62], bottom: [28, 86, 105], glow: [56, 189, 248] },
      { top: [24, 42, 52], bottom: [38, 92, 78], glow: [250, 204, 21] },
      { top: [14, 46, 56], bottom: [24, 96, 88], glow: [110, 231, 183] },
    ],
  };

  const set = palettes[tone] || palettes.passionate;
  const pal = set[(sceneId - 1) % set.length];

  const rawData = Buffer.alloc(height * (1 + width * 3));

  // Decorative bokeh orb centers
  const orbs = [
    { cx: width * (0.22 + 0.12 * (sceneId % 3)), cy: height * 0.32, r: 150 },
    { cx: width * (0.76 - 0.08 * (sceneId % 2)), cy: height * 0.65, r: 180 },
    { cx: width * 0.5, cy: height * 0.25, r: 120 },
  ];

  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    rawData[rowStart] = 0; // filter type 0 (None)
    const yf = y / height;

    for (let x = 0; x < width; x++) {
      const xf = x / width;
      const diag = (xf * 0.45 + yf * 0.55);

      let r = pal.top[0] * (1 - diag) + pal.bottom[0] * diag;
      let g = pal.top[1] * (1 - diag) + pal.bottom[1] * diag;
      let b = pal.top[2] * (1 - diag) + pal.bottom[2] * diag;

      // Add glowing bokeh orbs
      for (const orb of orbs) {
        const dx = x - orb.cx;
        const dy = y - orb.cy;
        const distSq = dx * dx + dy * dy;
        const radiusSq = orb.r * orb.r;
        if (distSq < radiusSq) {
          const factor = Math.pow(1 - distSq / radiusSq, 2) * 0.38;
          r += pal.glow[0] * factor;
          g += pal.glow[1] * factor;
          b += pal.glow[2] * factor;
        }
      }

      // Subtle architectural perspective grid lines in lower third
      if (y > height * 0.62 && (y % 24 === 0 || (x + y * 2) % 64 === 0)) {
        r += 18;
        g += 24;
        b += 32;
      }

      const pxOffset = rowStart + 1 + x * 3;
      rawData[pxOffset] = Math.min(255, Math.max(0, Math.round(r)));
      rawData[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(g)));
      rawData[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type 2 = truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idatData = zlib.deflateSync(rawData, { level: 6 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const pngBuffer = Buffer.concat([
    signature,
    makePngChunk("IHDR", ihdr),
    makePngChunk("IDAT", idatData),
    makePngChunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outputPath, pngBuffer);
}

/**
 * Timeout wrapper so API calls never hang indefinitely
 */
export function withTimeout(promise, timeoutMs, label = "API呼び出し") {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} がタイムアウトしました (${Math.round(timeoutMs / 1000)}秒経過)`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Generate TTS audio via Gemini 3.8 Flash Lite TTS / 3.8 Flash TTS,
 * falling back across Flash TTS models or mock WAV if API key is missing.
 */
async function generateSceneAudio({
  ai,
  scene,
  tone,
  useMock,
  outputPath,
  emitLog = () => {},
}) {
  const targetEstSeconds = estimateSecondsFromText(
    scene.narration,
    scene.durationInSeconds || 4.5
  );

  if (useMock || !ai) {
    emitLog("info", `[Scene ${scene.id}] モック音声WAVを生成中 (目標 ${targetEstSeconds}秒)...`);
    generateMockWavFile(outputPath, targetEstSeconds, scene.id);
    return { mode: "mock" };
  }

  const voiceMap = {
    passionate: "Fenrir",
    smart: "Kore",
    friendly: "Aoede",
  };
  const voiceName = voiceMap[tone] || "Kore";

  const ttsModels = [
    "gemini-3.8-flash-lite-tts",
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
  ];

  let lastError = null;
  for (const modelName of ttsModels) {
    const t0 = Date.now();
    try {
      emitLog(
        "info",
        `[Scene ${scene.id}] 🔊 TTS音声生成中 (モデル: ${modelName}, ボイス: ${voiceName}, ${scene.narration.length}文字)...`
      );
      const response = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: scene.narration }] }],
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
        }),
        35000,
        `[Scene ${scene.id}] TTS (${modelName})`
      );

      const parts = response?.candidates?.[0]?.content?.parts || [];
      const audioPart = parts.find((p) => p.inlineData?.data);
      const inlineData = audioPart?.inlineData;
      if (!inlineData?.data) {
        throw new Error(`${modelName} から音声データが空で返されました`);
      }

      const rawAudioBuf = Buffer.from(inlineData.data, "base64");
      if (rawAudioBuf.length > 12 && rawAudioBuf.toString("ascii", 0, 4) === "RIFF") {
        fs.writeFileSync(outputPath, rawAudioBuf);
      } else {
        const padSamples = Math.round(24000 * 0.25);
        const padBuf = Buffer.alloc(padSamples * 2);
        const combinedPcm = Buffer.concat([rawAudioBuf, padBuf]);
        const wavHeader = createWavHeader(combinedPcm.length, 24000, 1, 16);
        fs.writeFileSync(outputPath, Buffer.concat([wavHeader, combinedPcm]));
      }
      const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
      emitLog(
        "success",
        `[Scene ${scene.id}] ✅ TTS音声生成成功 (${modelName}, 所要 ${elapsedSec}秒)`
      );
      return { mode: modelName };
    } catch (err) {
      lastError = err;
      emitLog(
        "warn",
        `[Scene ${scene.id}] ⚠️ ${modelName} エラー (${((Date.now() - t0) / 1000).toFixed(1)}秒): ${err.message} -> 次のTTSモデルを試行します`
      );
    }
  }

  emitLog(
    "error",
    `[Scene ${scene.id}] ❌ 全TTSモデル失敗のためモック音声へフォールバック: ${lastError?.message}`
  );
  generateMockWavFile(outputPath, targetEstSeconds, scene.id);
  return { mode: "mock-fallback", error: lastError?.message };
}

/**
 * Generate background image via Gemini 3.1 Flash Lite Image / 3.1 Flash Image
 * (or Veo video when available), with graceful fallback
 */
async function generateSceneBackground({
  ai,
  scene,
  aspectRatio,
  tone,
  visualTheme = "dojo-scroll",
  useMock,
  emitLog = () => {},
}) {
  // Custom uploaded image: keep existing file if it exists
  if (scene.bgMode === "custom" && scene.bgFile) {
    const customFullPath = path.join(ROOT_DIR, "public", scene.bgFile);
    if (fs.existsSync(customFullPath)) {
      emitLog("info", `[Scene ${scene.id}] 📁 カスタム背景画像 (${scene.bgFile}) を使用します`);
      return { bgFile: scene.bgFile, mode: "custom" };
    }
  }

  const pngRelPath = `generated/scene${scene.id}_bg.png`;
  const pngFullPath = path.join(ROOT_DIR, "public", pngRelPath);
  const mp4RelPath = `generated/scene${scene.id}_bg.mp4`;
  const mp4FullPath = path.join(ROOT_DIR, "public", mp4RelPath);

  if (useMock || !ai) {
    emitLog("info", `[Scene ${scene.id}] 🖼️ モック背景画像を生成中...`);
    generateMockPngFile(pngFullPath, scene.id, tone);
    return { bgFile: pngRelPath, mode: "mock" };
  }

  const orientDesc =
    aspectRatio === "9:16"
      ? "vertical 9:16 portrait orientation (1080x1920)"
      : "widescreen 16:9 landscape orientation (1920x1080)";

  const placement = scene.textPlacement || "center";
  const layoutDirective =
    placement === "left"
      ? "LAYOUT & CONTRAST RULE: The LEFT 48% of the composition MUST be a clean, simple, uncluttered dark high-contrast negative space (smooth deep sumi-black / dark indigo / shadowed wooden wall with no busy details) specifically reserved for overlaying typography and a Japanese scroll panel. Place all main subjects, characters, and vibrant lighting on the RIGHT 52% of the frame."
      : placement === "right"
      ? "LAYOUT & CONTRAST RULE: The RIGHT 48% of the composition MUST be a clean, simple, uncluttered dark high-contrast negative space (smooth deep sumi-black / dark indigo / shadowed wooden wall with no busy details) specifically reserved for overlaying typography and a Japanese scroll panel. Place all main subjects, characters, and vibrant lighting on the LEFT 52% of the frame."
      : "LAYOUT & CONTRAST RULE: Keep the central area clean and softly lit with high-contrast dark/warm tones so a central Japanese scroll or gold folding screen (Byobu) stands out clearly, framing architectural and atmospheric details around the periphery.";

  const themeStyleDesc =
    visualTheme === "dojo-scroll"
      ? "traditional Japanese martial arts dojo and gold folding screen (Byobu) aesthetic, warm lantern glow, floating gold dust, refined wood and sumi-ink atmosphere"
      : visualTheme === "cyber-impact"
      ? "futuristic cyber neon studio aesthetic, sleek dark glass and glowing light beams"
      : visualTheme === "pop-campus"
      ? "bright energetic modern campus aesthetic, vibrant and welcoming atmosphere"
      : "sophisticated corporate commercial aesthetic, clean modern architecture";

  const promptSuffix = `${themeStyleDesc}, ${layoutDirective}, ${orientDesc}, cinematic lighting, strictly no text, no letters, no kanji, no watermark`;
  const fullPrompt = `${scene.bgPrompt}. ${promptSuffix}`;

  // Mode 1: AI Video Generation via Gemini Omni 1.1 Flash (Interactions API)
  if (scene.bgMode === "video") {
    const videoModels = [
      "gemini-omni-1.1-flash",
      "gemini-omni-flash-preview",
    ];

    for (const vidModel of videoModels) {
      const t0 = Date.now();
      let heartbeatTimer = null;
      try {
        emitLog(
          "info",
          `[Scene ${scene.id}] 🎥 AI背景映像(.mp4)を生成中 (モデル: ${vidModel}, 配置: ${placement})...`
        );

        heartbeatTimer = setInterval(() => {
          const sec = Math.round((Date.now() - t0) / 1000);
          emitLog(
            "info",
            `[Scene ${scene.id}] ⏳ ${vidModel} で背景映像をレンダリング中... (${sec}秒経過)`
          );
        }, 8000);

        const videoPrompt = `${fullPrompt}. Cinematic live-action or high-end 3D motion video, smooth camera movement, natural atmospheric motion (flickering lantern light, drifting gold dust). Keep the ${placement.toUpperCase()} text zone uncluttered and high-contrast throughout the entire video.`;

        const interaction = await withTimeout(
          ai.interactions.create({
            model: vidModel,
            input: videoPrompt,
            response_format: {
              type: "video",
              aspect_ratio: aspectRatio === "9:16" ? "9:16" : "16:9",
            },
          }),
          150000,
          `[Scene ${scene.id}] AI映像生成 (${vidModel})`
        );

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }

        const outputVideo = interaction?.output_video;
        if (outputVideo?.data) {
          const videoBuffer = Buffer.from(outputVideo.data, "base64");
          fs.writeFileSync(mp4FullPath, videoBuffer);
          const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
          const sizeMb = (videoBuffer.length / (1024 * 1024)).toFixed(2);
          emitLog(
            "success",
            `[Scene ${scene.id}] ✅ AI背景映像(.mp4)の生成完了！ (${vidModel}, ${sizeMb}MB, 所要 ${elapsedSec}秒)`
          );
          return { bgFile: mp4RelPath, mode: vidModel };
        }

        if (outputVideo?.uri) {
          const apiKey = resolveGeminiApiKey();
          const downloadUrl = outputVideo.uri.includes("?")
            ? `${outputVideo.uri}&key=${apiKey}`
            : `${outputVideo.uri}?key=${apiKey}`;
          const res = await fetch(downloadUrl);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            fs.writeFileSync(mp4FullPath, Buffer.from(arrayBuf));
            const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
            emitLog(
              "success",
              `[Scene ${scene.id}] ✅ AI背景映像(.mp4)のダウンロード完了 (${vidModel}, 所要 ${elapsedSec}秒)`
            );
            return { bgFile: mp4RelPath, mode: vidModel };
          }
        }

        throw new Error(`${vidModel} から映像データ(output_video)が返されませんでした`);
      } catch (err) {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        emitLog(
          "warn",
          `[Scene ${scene.id}] ⚠️ ${vidModel} 映像生成エラー (${((Date.now() - t0) / 1000).toFixed(1)}秒): ${err.message}`
        );
      }
    }

    emitLog(
      "warn",
      `[Scene ${scene.id}] ⚠️ AI映像生成からFlash静止画生成（＋ズームアニメ）へフォールバックします`
    );
  }

  // Mode 2: Fast & Low-Cost Gemini Flash Image Generation
  const imageModels = [
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image",
    "gemini-nano-banana-2.1",
  ];

  let lastImgError = null;
  for (const imgModel of imageModels) {
    const t0 = Date.now();
    try {
      emitLog(
        "info",
        `[Scene ${scene.id}] 🖼️ 背景静止画を生成中 (モデル: ${imgModel})...`
      );
      const imgRes = await withTimeout(
        ai.models.generateContent({
          model: imgModel,
          contents: fullPrompt,
          config: {
            responseModalities: ["IMAGE"],
          },
        }),
        35000,
        `[Scene ${scene.id}] 画像生成 (${imgModel})`
      );

      const parts = imgRes?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p) => p.inlineData?.data);
      const b64 = imgPart?.inlineData?.data;
      if (b64) {
        fs.writeFileSync(pngFullPath, Buffer.from(b64, "base64"));
        const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
        emitLog(
          "success",
          `[Scene ${scene.id}] ✅ 背景静止画の生成成功 (${imgModel}, 所要 ${elapsedSec}秒)`
        );
        return { bgFile: pngRelPath, mode: imgModel };
      }
      throw new Error(`${imgModel} から画像データが空で返されました`);
    } catch (err) {
      lastImgError = err;
      emitLog(
        "warn",
        `[Scene ${scene.id}] ⚠️ ${imgModel} エラー (${((Date.now() - t0) / 1000).toFixed(1)}秒): ${err.message} -> 次の画像モデルを試行します`
      );
    }
  }

  emitLog(
    "error",
    `[Scene ${scene.id}] ❌ 全画像モデル失敗のためプロシージャル背景画像へフォールバック: ${lastImgError?.message}`
  );
  generateMockPngFile(pngFullPath, scene.id, tone);
  return { bgFile: pngRelPath, mode: "mock-fallback", error: lastImgError?.message };
}

/**
 * Main Asset Generation & Audio-Driven Duration Calculation Pipeline
 */
export async function generateAssets({
  mock = false,
  onlySceneId = null,
  forceStillMode = false,
  onLog = null,
} = {}) {
  const emitLog = (level, message) => {
    const prefix =
      level === "error"
        ? "❌"
        : level === "warn"
        ? "⚠️"
        : level === "success"
        ? "✅"
        : "ℹ️";
    console.log(`${prefix} ${message}`);
    if (typeof onLog === "function") {
      onLog(level, message);
    }
  };

  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const scenario = JSON.parse(fs.readFileSync(SCENARIO_PATH, "utf-8"));
  const apiKey = resolveGeminiApiKey();
  const hasValidKey = Boolean(apiKey);

  const useMock = mock || !hasValidKey;
  const ai = !useMock ? new GoogleGenAI({ apiKey }) : null;

  emitLog(
    "info",
    `🎬 CM素材生成＆音声尺計測を開始 (モード: ${
      useMock ? "モック生成" : "Gemini API本番生成"
    }, 比率: ${scenario.aspectRatio}, タイプ: ${scenario.cmType})`
  );

  const fps = scenario.fps || 30;
  const targetScenes = scenario.scenes.filter(
    (s) => onlySceneId === null || Number(s.id) === Number(onlySceneId)
  );

  const processSingleScene = async (scene, idx) => {
    emitLog(
      "info",
      `--- [進捗 ${idx + 1}/${targetScenes.length}] シーン${scene.id}（${scene.role} | 配置:${scene.textPlacement || "center"} / 枠:${scene.frameStyle || "makimono"} / 背景:${forceStillMode ? "image" : scene.bgMode || "video"}）の処理を開始 ---`
    );

    if (scenario.cmType === "evergreen") {
      if (scene.narrationEvergreen) scene.narration = scene.narrationEvergreen;
      if (scene.subtitleEvergreen) scene.subtitle = scene.subtitleEvergreen;
    } else {
      if (scene.narrationDated) scene.narration = scene.narrationDated;
      if (scene.subtitleDated) scene.subtitle = scene.subtitleDated;
    }

    const wavRelPath = `generated/scene${scene.id}_audio.wav`;
    const wavFullPath = path.join(ROOT_DIR, "public", wavRelPath);

    // 1. Generate TTS Audio
    await generateSceneAudio({
      ai,
      scene,
      tone: scenario.tone || "passionate",
      useMock,
      outputPath: wavFullPath,
      emitLog,
    });
    scene.audioFile = wavRelPath;

    // 2. Measure exact WAV playback duration & calculate frame count
    const measuredSeconds = measureWavDurationSeconds(wavFullPath);
    scene.durationInSeconds = Number(measuredSeconds.toFixed(2));
    scene.durationInFrames = Math.max(30, Math.round(measuredSeconds * fps));

    emitLog(
      "info",
      `[Scene ${scene.id}] ⏱️ WAVバイト数から音声尺を確定: ${scene.durationInSeconds}秒 (${scene.durationInFrames} frames @ ${fps}fps)`
    );

    // 3. Generate Background Image / Video
    const effectiveScene =
      forceStillMode && scene.bgMode === "video"
        ? { ...scene, bgMode: "image" }
        : scene;

    const bgResult = await generateSceneBackground({
      ai,
      scene: effectiveScene,
      aspectRatio: scenario.aspectRatio || "16:9",
      tone: scenario.tone || "passionate",
      visualTheme: scenario.visualTheme || "dojo-scroll",
      useMock,
      emitLog,
    });
    scene.bgFile = bgResult.bgFile;

    emitLog(
      "success",
      `[Scene ${scene.id}] ✨ シーン${scene.id}完了 (尺: ${scene.durationInSeconds}秒 / 背景: ${scene.bgFile})`
    );
  };

  // Run in batches of 2 scenes concurrently to speed up AI video/image generation
  const batchSize = 2;
  for (let i = 0; i < targetScenes.length; i += batchSize) {
    const batch = targetScenes.slice(i, i + batchSize);
    await Promise.all(
      batch.map((scene, batchIdx) => processSingleScene(scene, i + batchIdx))
    );
  }

  // Save updated scenario & Remotion generated-props.json
  const jsonString = JSON.stringify(scenario, null, 2);
  fs.writeFileSync(SCENARIO_PATH, jsonString, "utf-8");
  fs.writeFileSync(GENERATED_PROPS_PATH, jsonString, "utf-8");

  const totalSec = scenario.scenes
    .reduce((acc, s) => acc + (s.durationInSeconds || 0), 0)
    .toFixed(2);
  const totalFrames = scenario.scenes.reduce(
    (acc, s) => acc + (s.durationInFrames || 0),
    0
  );

  emitLog(
    "success",
    `🎉 全シーン素材生成＆尺確定が完了！ 合計尺: ${totalSec}秒 (${totalFrames} frames @ ${fps}fps)`
  );

  return {
    scenario,
    useMock,
    totalSeconds: Number(totalSec),
    totalFrames,
  };
}

// Execute when run directly from CLI
const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const isMock = args.includes("--mock");
  const sceneArg = args.find((a) => a.startsWith("--scene="));
  const onlySceneId = sceneArg ? Number(sceneArg.split("=")[1]) : null;

  generateAssets({ mock: isMock, onlySceneId }).catch((err) => {
    console.error("素材生成エラー:", err);
    process.exit(1);
  });
}

