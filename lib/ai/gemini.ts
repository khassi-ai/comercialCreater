import { GoogleGenAI } from "@google/genai";
import { ScenarioData, ProjectOptions, SceneData } from "../types";

export async function generateScenarioFromLp({
  lpText,
  options,
}: {
  lpText: string;
  options: ProjectOptions;
}): Promise<ScenarioData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  const ai = new GoogleGenAI({ apiKey });
  const sceneCount = options.sceneCount || 4;
  const isLandscape = options.aspectRatio !== "9:16";

  const prompt = `あなたは日本市場で最大の成果を出すトップ動画広告ディレクターです。
以下のLP（ランディングページ）のテキスト原稿・告知文を徹底的に読み込み、視聴者の心を掴んで行動（クリック・申込・購入）へ導く「${sceneCount}カット構成」のショート広告動画の台本・演出構成をJSON形式で企画・生成してください。

【LP原稿テキスト】
${lpText}

【制作ルール】
1. カット数: 厳密に ${sceneCount} カット。
   - カット1: 「フック」 視聴者が思わず手を止める強烈な問いかけや悩み提起
   - カット2: 「メリット/解決策」 独自の価値提案・解決できる未来
   - カット3: 「信頼・特徴」 具体的な数字や実績・権威性
   - 最終カット: 「CTA・行動喚起」 今すぐ行動すべき理由と特典・オファー
2. 画面サイズ: ${isLandscape ? "16:9 横型 (1920x1080)" : "9:16 縦型 (1080x1920)"}
3. テロップ・見出し文字: スマホでも一瞬で読める短く強烈なインパクト（12〜18文字以内）
4. ナレーション: 自然な日本語の話し言葉で、1カットあたり約4〜6秒（20〜35文字程度）
5. 背景プロンプト (bgPrompt): 
   - テロップの配置（中央・左・右）に合わせて、文字が映える落ち着いた高コントラストの余白（ネガティブスペース）を確保した、ドラマチックで映画のような背景描写（英語）。
   - "cinematic lighting, high resolution, clean dark background with ample negative space for text overlay, strictly no text, no letters, no watermark" を必ず含めてください。
6. トーン: ${options.tone}

必ず以下のJSONフォーマットのみを返してください（Markdownのバッククォートなし、純粋なJSON）：
{
  "title": "広告タイトル",
  "aspectRatio": "${options.aspectRatio}",
  "cmType": "evergreen",
  "tone": "${options.tone}",
  "visualTheme": "dojo-scroll",
  "themeProposalReason": "このLPの魅力と世界観に合わせた演出方針の理由",
  "fps": 30,
  "rawAnnouncement": "${lpText.slice(0, 100).replace(/\n/g, " ")}",
  "scenes": [
    {
      "id": 1,
      "role": "フック",
      "narration": "読み上げナレーション文章（25文字前後）",
      "heading": "インパクト見出しテロップ",
      "subBadge": "上部に小さく出る補足バッジ",
      "subtitle": "字幕テキスト",
      "bgPrompt": "English cinematic background prompt with ample negative space, strictly no text",
      "textPlacement": "center",
      "durationInSeconds": 4.5,
      "durationInFrames": 135
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });

  const rawJson = response.text?.trim() || "";
  try {
    const parsed = JSON.parse(rawJson) as ScenarioData;
    // デフォルト補正
    parsed.fps = 30;
    parsed.scenes = parsed.scenes.map((s, idx) => ({
      ...s,
      id: idx + 1,
      durationInSeconds: s.durationInSeconds || 4.5,
      durationInFrames: Math.round((s.durationInSeconds || 4.5) * 30),
      textPlacement: s.textPlacement || (idx === 1 ? "left" : idx === 2 ? "right" : "center"),
      bgMode: options.quality === "premium_video" ? "video" : "image",
    }));
    return parsed;
  } catch (err: any) {
    console.error("Failed to parse Gemini scenario JSON:", rawJson, err);
    throw new Error("シナリオJSONの生成に失敗しました: " + err.message);
  }
}

