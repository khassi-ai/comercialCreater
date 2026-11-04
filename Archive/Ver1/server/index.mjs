import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import {
  generateAssets,
  estimateSecondsFromText,
  resolveGeminiApiKey,
  withTimeout,
} from "../scripts/generate-assets.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCENARIO_PATH = path.join(ROOT_DIR, "scenario.json");
const GENERATED_PROPS_PATH = path.join(ROOT_DIR, "src", "generated-props.json");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const OUT_DIR = path.join(ROOT_DIR, "out");
const LOGS_DIR = path.join(ROOT_DIR, "logs");
const LOG_FILE_PATH = path.join(LOGS_DIR, "studio.log");

fs.mkdirSync(LOGS_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/generated", express.static(path.join(PUBLIC_DIR, "generated")));
app.use("/out", express.static(OUT_DIR));

// Real-time Server Log Buffer & SSE Broadcast System
const MAX_LOGS = 300;
let logSeq = 0;
const serverLogs = [];
const sseClients = new Set();

function pushLog(level, message) {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
  const entry = {
    id: ++logSeq,
    time: timeStr,
    level, // 'info' | 'success' | 'warn' | 'error'
    message: String(message),
  };

  serverLogs.push(entry);
  if (serverLogs.length > MAX_LOGS) {
    serverLogs.shift();
  }

  try {
    fs.appendFileSync(
      LOG_FILE_PATH,
      `[${now.toISOString()}] [${level.toUpperCase()}] ${entry.message}\n`,
      "utf-8"
    );
  } catch {
    // ignore file log error
  }

  const payload = `data: ${JSON.stringify(entry)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
  return entry;
}

// GET /api/logs (Polling endpoint for logs since a given sequence ID)
app.get("/api/logs", (req, res) => {
  const since = Number(req.query.since || 0);
  const items = serverLogs.filter((l) => l.id > since);
  res.json({
    logs: items,
    latestId: logSeq,
    logFilePath: "logs/studio.log",
  });
});

// POST /api/logs/clear
app.post("/api/logs/clear", (req, res) => {
  serverLogs.length = 0;
  pushLog("info", "ログコンソールをクリアしました");
  res.json({ success: true, latestId: logSeq });
});

// GET /api/logs/stream (Server-Sent Events real-time stream)
app.get("/api/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  sseClients.add(res);
  req.on("close", () => {
    sseClients.delete(res);
  });
});

function hasValidGeminiKey() {
  const key = resolveGeminiApiKey();
  return Boolean(key);
}

function readScenario() {
  const raw = fs.readFileSync(SCENARIO_PATH, "utf-8");
  return JSON.parse(raw);
}

function saveScenario(scenarioData) {
  const jsonStr = JSON.stringify(scenarioData, null, 2);
  fs.writeFileSync(SCENARIO_PATH, jsonStr, "utf-8");
  fs.writeFileSync(GENERATED_PROPS_PATH, jsonStr, "utf-8");
}

/**
 * Intelligent fallback parser when GEMINI_API_KEY is not configured
 */
function buildSmartFallbackScenario({
  rawAnnouncement,
  aspectRatio = "16:9",
  cmType = "dated",
  tone = "passionate",
}) {
  const current = readScenario();
  const text = (rawAnnouncement || "").trim();

  // If the text is the default Calculation Dojo announcement or empty, return tuned preset
  if (!text || text.includes("計算道場")) {
    const isEvergreen = cmType === "evergreen";
    const preset = {
      ...current,
      aspectRatio,
      cmType,
      tone,
      rawAnnouncement: text || current.rawAnnouncement,
      scenes: [
        {
          id: 1,
          role: "フック",
          narration: "大好評の計算道場が、さらにパワーアップして帰ってきた！",
          heading: "計算道場 パワーアップ！",
          subBadge: "CPAバーチャル校 名物イベント",
          subtitle: "大好評の「計算道場」がさらにパワーアップ！",
          bgPrompt:
            "近未来的でスタイリッシュなバーチャル空間の講義ホール、黄金とブルーの光のエフェクト、エネルギッシュな照明、高精細シネマティック背景、文字なし",
          bgMode: current.scenes?.[0]?.bgMode || "image",
          audioFile: "generated/scene1_audio.wav",
          bgFile: current.scenes?.[0]?.bgFile || "generated/scene1_bg.png",
          durationInSeconds: 4.5,
          durationInFrames: 135,
        },
        {
          id: 2,
          role: "メリット",
          narration:
            "財務会計論と管理会計論を毎月ダブル開催！大好評のチューター解説つき！",
          heading: "財計＆管理 毎月W開催！",
          subBadge: "大好評チューター解説つき",
          subtitle: "財務会計論＆管理会計論を毎月W開催！チューター解説つき",
          bgPrompt:
            "明るいモダンな自習室・デジタル教室でタブレットと電卓を使って颯爽と会計の計算演習に取り組む様子、爽やかで知的なライティング、文字なし",
          bgMode: current.scenes?.[1]?.bgMode || "image",
          audioFile: "generated/scene2_audio.wav",
          bgFile: current.scenes?.[1]?.bgFile || "generated/scene2_bg.png",
          durationInSeconds: 5.5,
          durationInFrames: 165,
        },
        {
          id: 3,
          role: "ルール",
          narration:
            "6択なしのガチンコ数値回答、全5問！学習1年目の挑戦も大歓迎です！",
          heading: "6択なし！数値回答の全5問",
          subBadge: "学習1年目も大歓迎！",
          subtitle: "6択なしの数値回答・全5問！学習1年目の挑戦も大歓迎",
          bgPrompt:
            "電卓を叩く手元のクローズアップと輝くデジタルスコアボードのエフェクト、集中力とスピード感あふれるドラマチックな構図、文字なし",
          bgMode: current.scenes?.[2]?.bgMode || "image",
          audioFile: "generated/scene3_audio.wav",
          bgFile: current.scenes?.[2]?.bgFile || "generated/scene3_bg.png",
          durationInSeconds: 5.5,
          durationInFrames: 165,
        },
        {
          id: 4,
          role: "インフォメーションボード",
          narration: isEvergreen
            ? "毎月開催！最新日程の確認・お申込みはフォームから！"
            : "11月14日と28日開催！今すぐお申込みフォームへ！",
          narrationDated: "11月14日と28日開催！今すぐお申込みフォームへ！",
          narrationEvergreen: "毎月開催！最新日程の確認・お申込みはフォームから！",
          heading: "計算道場 パワーアップ開催！",
          subBadge: isEvergreen ? "毎月定期開催中！" : "参加無料・エントリー受付中",
          subtitle: isEvergreen
            ? "毎月W開催！最新日程・お申込みはフォームへ"
            : "11/14(土)・11/28(土)開催！今すぐお申込みフォームへ",
          subtitleDated: "11/14(土)・11/28(土)開催！今すぐお申込みフォームへ",
          subtitleEvergreen: "毎月W開催！最新日程・お申込みはフォームへ",
          bgPrompt:
            "開放感のあるバーチャルキャンパスの1F教室エントランス、温かみのある光のパーティクル、清潔感のあるモダン建築背景、文字なし",
          bgMode: current.scenes?.[3]?.bgMode || "image",
          audioFile: "generated/scene4_audio.wav",
          bgFile: current.scenes?.[3]?.bgFile || "generated/scene4_bg.png",
          durationInSeconds: 4.5,
          durationInFrames: 135,
          infoBoard: {
            title: "CPAバーチャル校「計算道場」",
            schedules: [
              "11/14(土) 20:00〜 管理会計論",
              "11/28(土) 20:00〜 財務会計論",
            ],
            evergreenSchedules: [
              "毎月開催！最新スケジュールはWebへ",
              "財務会計論・管理会計論 毎月W開催",
            ],
            location: "CPAバーチャル校 1F教室",
            target: "短答未受験・学習1年目大歓迎！",
            ctaText: "今すぐお申込みフォームへ！",
            evergreenCtaText: "お申込みはフォームから ▶",
          },
        },
      ],
    };
    return preset;
  }

  // Extract custom lines from arbitrary pasted announcement text
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[・\-*#■◆▶\s]+/, "").trim())
    .filter((l) => l.length > 2);

  const titleLine = (lines[0] || "注目の特別イベント開催！").slice(0, 22);
  const dateMatches = lines.filter((l) =>
    /(\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2}|開催日|日時)/.test(l)
  );
  const extractedSchedules =
    dateMatches.length > 0
      ? dateMatches.slice(0, 2).map((s) => s.slice(0, 28))
      : ["次回開催日程はWebページにて公開中"];

  const locationMatch = lines.find((l) =>
    /(会場|場所|校|オンライン|Zoom|バーチャル|教室|ホール)/.test(l)
  );
  const targetMatch = lines.find((l) =>
    /(対象|歓迎|向け|どなたでも|初心者|1年目|受験)/.test(l)
  );

  const merit1 = (lines[1] || "見逃せない注目ポイントが満載！").slice(0, 26);
  const merit2 = (lines[2] || "実践的なプログラムでステップアップ！").slice(0, 26);
  const isEvergreen = cmType === "evergreen";

  return {
    title: `${titleLine} CM`,
    aspectRatio,
    cmType,
    tone,
    fps: 30,
    rawAnnouncement: text,
    scenes: [
      {
        id: 1,
        role: "フック",
        narration: `注目のイベント、${titleLine}がついに開催決定！`,
        heading: titleLine.slice(0, 16),
        subBadge: "特別イベント開催決定！",
        subtitle: `${titleLine}がついに開催決定！`,
        bgPrompt:
          "スタイリッシュなイベントステージと華やかな光の演出、高精細シネマティック背景、文字なし",
        bgMode: "image",
        audioFile: "generated/scene1_audio.wav",
        bgFile: "generated/scene1_bg.png",
        durationInSeconds: 4.5,
        durationInFrames: 135,
      },
      {
        id: 2,
        role: "メリット",
        narration: `${merit1}充実のプログラムであなたの挑戦をサポートします！`,
        heading: merit1.slice(0, 16),
        subBadge: "充実のサポート体制",
        subtitle: merit1,
        bgPrompt:
          "モダンで明るいデジタル空間で生き生きと学ぶ参加者たちのイメージ、爽やかな照明、文字なし",
        bgMode: "image",
        audioFile: "generated/scene2_audio.wav",
        bgFile: "generated/scene2_bg.png",
        durationInSeconds: 5.5,
        durationInFrames: 165,
      },
      {
        id: 3,
        role: "ルール・特徴",
        narration: `${merit2}初めての方のチャレンジも大歓迎です！`,
        heading: merit2.slice(0, 16),
        subBadge: "初めての参加も大歓迎！",
        subtitle: merit2,
        bgPrompt:
          "未来感のあるクリーンなプレゼンテーション空間と輝く光のエフェクト、ドラマチックな構図、文字なし",
        bgMode: "image",
        audioFile: "generated/scene3_audio.wav",
        bgFile: "generated/scene3_bg.png",
        durationInSeconds: 5.5,
        durationInFrames: 165,
      },
      {
        id: 4,
        role: "インフォメーションボード",
        narration: isEvergreen
          ? "好評開催中！最新スケジュールとお申込みはフォームから！"
          : `${extractedSchedules[0]}に開催！今すぐお申込みフォームへ！`,
        narrationDated: `${extractedSchedules[0]}に開催！今すぐお申込みフォームへ！`,
        narrationEvergreen:
          "好評開催中！最新スケジュールとお申込みはフォームから！",
        heading: titleLine.slice(0, 18),
        subBadge: isEvergreen ? "定期開催中！" : "エントリー受付中",
        subtitle: isEvergreen
          ? "最新スケジュール・お申込みはフォームから！"
          : "詳細はインフォメーションを確認！今すぐお申込みへ",
        subtitleDated: "詳細はインフォメーションを確認！今すぐお申込みへ",
        subtitleEvergreen: "最新スケジュール・お申込みはフォームから！",
        bgPrompt:
          "開放感のあるモダンなキャンパスのエントランスと温かい光のパーティクル、文字なし",
        bgMode: "image",
        audioFile: "generated/scene4_audio.wav",
        bgFile: "generated/scene4_bg.png",
        durationInSeconds: 4.5,
        durationInFrames: 135,
        infoBoard: {
          title: titleLine.slice(0, 20),
          schedules: extractedSchedules,
          evergreenSchedules: [
            "定期開催中！最新スケジュールはWebへ",
            "次回日程・詳細は申込フォームをチェック",
          ],
          location: locationMatch
            ? locationMatch.slice(0, 22)
            : "オンライン / 特設会場",
          target: targetMatch
            ? targetMatch.slice(0, 22)
            : "どなたでも参加大歓迎！",
          ctaText: "今すぐお申込みフォームへ！",
          evergreenCtaText: "お申込みはフォームから ▶",
        },
      },
    ],
  };
}

// GET /api/scenario
app.get("/api/scenario", (req, res) => {
  try {
    const scenario = readScenario();
    const mp4Exists = fs.existsSync(path.join(OUT_DIR, "cm_video.mp4"));
    res.json({
      scenario,
      hasApiKey: hasValidGeminiKey(),
      mp4Exists,
      videoUrl: mp4Exists ? `/out/cm_video.mp4` : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scenario (Save edits from Web UI)
app.post("/api/scenario", (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario || !Array.isArray(scenario.scenes)) {
      return res.status(400).json({ error: "不正なシナリオデータです" });
    }
    saveScenario(scenario);
    res.json({ success: true, scenario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/plan-cm (Generate 20s 4-cut CM structure from announcement text using Gemini 2.5 Flash)
app.post("/api/plan-cm", async (req, res) => {
  const {
    rawAnnouncement,
    aspectRatio = "16:9",
    cmType = "dated",
    tone = "passionate",
  } = req.body;

  if (!rawAnnouncement || !rawAnnouncement.trim()) {
    return res.status(400).json({ error: "告知文を入力してください" });
  }

  if (!hasValidGeminiKey()) {
    const fallback = buildSmartFallbackScenario({
      rawAnnouncement,
      aspectRatio,
      cmType,
      tone,
    });
    saveScenario(fallback);
    return res.json({
      scenario: fallback,
      mode: "mock-fallback",
      message:
        "GEMINI_API_KEY未設定のため、ローカル解析プリセットで4カットCM構成を生成しました。",
    });
  }

  try {
    const apiKey = resolveGeminiApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const toneDesc =
      tone === "passionate"
        ? "熱血・スピード感・エネルギッシュ"
        : tone === "friendly"
          ? "親しみやすい・安心感・ウェルカムな雰囲気"
          : "スマート・知的・ビジネスライク";

    const modeDesc =
      cmType === "evergreen"
        ? "汎用CMモード（日付なし・常設用）：具体的な開催日付（〇月〇日など）をナレーションや見出しから省き、「毎月開催！」「次回の日程・お申込みはフォームから！」などいつでも使い回せる表現にしてください。"
        : "日付入りピンポイント告知モード：告知文から具体的な開催日程・時間・場所・対象者を正確に抽出し、シーン4で日付入り告知を行ってください。";

    const prompt = `あなたはプロのCMアートディレクター兼コピーライターです。
以下のイベント告知文から、視聴者の心を掴む「20秒のCM動画（全4シーン構成）」の企画データおよび「ビジュアルテーマ＆フォント・文字配置設計」をJSON形式で作成してください。

【厳守ルール】
1. 全4シーン構成（シーン1：フック 約4.5秒、シーン2：メリット 約5.5秒、シーン3：ルールや特徴 約5.5秒、シーン4：インフォメーションボード 約4.5秒）。
2. 全4シーンのナレーション合計文字数は「110〜130文字程度」（各シーン25〜33文字程度、合計約20秒）に厳密に収めること。
3. トーン＆マナー：${toneDesc}
4. CMモード指定：${modeDesc}
5. ビジュアルテーマ＆フォント提案（visualTheme / themeProposalReason）：
   イベントの世界観に合わせて以下の4つから最適な「visualTheme」を1つ選び、「themeProposalReason」に選んだ理由（モチーフ・フォント・配色の狙い）を80〜120文字で記述してください。
   - "dojo-scroll": 🏯 和風道場・巻物＆金屏風テーマ（道場・勝負・特訓・和風イベント向け。極太明朝体・毛筆書体＋展開する和紙の巻物・金屏風パネル）
   - "cyber-impact": ⚡ サイバー・インパクトテーマ（IT・テック・スピード勝負向け。超極太ゴシック体＋ネオンパネル）
   - "corporate-smart": 💎 王道ビジネス・スマートテーマ（セミナー・説明会・資格講座向け。洗練ゴシック体＋グラスパネル）
   - "pop-campus": 🌈 ポップ＆キャンパステーマ（初心者歓迎・交流イベント向け。丸みポップ書体＋明るいパネル）
6. 各シーンの文字配置（textPlacement）と枠モチーフ（frameStyle）と背景余白指定（bgPrompt）：
   - シーン1は textPlacement: "center", シーン2は "left", シーン3は "right", シーン4は "center" のように視線誘導にメリハリをつけてください。
   - frameStyle は visualTheme が "dojo-scroll" の場合は "makimono"（和紙の巻物展開）と "byobu"（金屏風・黒漆額縁）を交互に使い、それ以外のテーマでは "glass" を基本にしてください。
   - bgPrompt（背景画像生成AIへの日本語指示）には、必ず「文字を配置する側（中央・左半分・右半分）は文字や巻物がくっきり読めるようシンプルで落ち着いた高コントラストな余白配色（墨黒・濃紺・暗い木目など）にし、反対側にメインの被写体を描画する」旨を具体的に含めてください（画像内に文字は描かせないこと）。

【出力JSONフォーマット】
{
  "title": "CMタイトル",
  "visualTheme": "dojo-scroll",
  "themeProposalReason": "イベントの世界観に合わせたテーマ・巻物/屏風モチーフ・明朝フォント・背景コントラスト設計の提案理由",
  "scenes": [
    {
      "id": 1,
      "role": "フック",
      "narration": "25〜33文字程度のナレーション",
      "narrationDated": "日付入りナレーション",
      "narrationEvergreen": "汎用ナレーション",
      "heading": "14文字以内のデカ文字",
      "subBadge": "14文字以内のサブバッジ",
      "subtitle": "下部テロップ",
      "subtitleDated": "日付入りテロップ",
      "subtitleEvergreen": "汎用テロップ",
      "textPlacement": "center",
      "frameStyle": "makimono",
      "bgPrompt": "文字配置領域をシンプルで高コントラストな配色にし、被写体を配置した背景描写（文字なし）",
      "infoBoard": {
        "title": "ボード見出し（シーン4のみ必須）",
        "schedules": ["日程1", "日程2"],
        "evergreenSchedules": ["毎月開催！最新スケジュールはWebへ"],
        "location": "開催場所",
        "target": "対象者",
        "ctaText": "今すぐお申込みフォームへ！",
        "evergreenCtaText": "お申込みはフォームから ▶"
      }
    }
  ]
}

【入力告知文】
${rawAnnouncement}`;

    const planningModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ];

    let response = null;
    let usedModel = planningModels[0];
    let lastPlanError = null;

    pushLog(
      "info",
      `[CM企画] 原稿（${rawAnnouncement.length}文字）から20秒（4カット）構成のAI生成を開始します (比率: ${aspectRatio}, モード: ${cmType})`
    );

    for (const modelName of planningModels) {
      const t0 = Date.now();
      try {
        pushLog("info", `[CM企画] 🤖 モデル ${modelName} にリクエスト送信中 (高速レスポンスモード)...`);
        const reqConfig = {
          responseMimeType: "application/json",
          ...(modelName.includes("3.8") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        };
        response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: reqConfig,
          }),
          25000,
          `[CM企画] ${modelName}`
        );
        usedModel = modelName;
        const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
        pushLog(
          "success",
          `[CM企画] ✅ ${modelName} で4カット構成の生成に成功しました！(所要 ${elapsedSec}秒)`
        );
        break;
      } catch (err) {
        lastPlanError = err;
        const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
        pushLog(
          "warn",
          `[CM企画] ⚠️ ${modelName} エラー (${elapsedSec}秒): ${err.message} -> 次のFlashモデルを試行します`
        );
      }
    }

    if (!response) {
      throw lastPlanError || new Error("利用可能なFlashモデルでの生成に失敗しました");
    }

    const parsed = JSON.parse(response.text);
    const fps = 30;
    const visualTheme = parsed.visualTheme || (rawAnnouncement.includes("道場") ? "dojo-scroll" : "corporate-smart");
    const themeProposalReason =
      parsed.themeProposalReason ||
      "イベントの世界観に合わせて最適なフォント・枠モチーフ（巻物/金屏風/グラス）・文字配置と背景コントラスト余白を自動設定しました。";

    const defaultPlacements = ["center", "left", "right", "center"];
    const defaultFrames =
      visualTheme === "dojo-scroll"
        ? ["makimono", "byobu", "makimono", "byobu"]
        : ["glass", "glass", "glass", "glass"];

    const normalizedScenes = (parsed.scenes || []).slice(0, 4).map((s, idx) => {
      const id = idx + 1;
      const estSec = estimateSecondsFromText(s.narration, idx === 0 || idx === 3 ? 4.5 : 5.5);
      return {
        id,
        role: s.role || (id === 4 ? "インフォメーションボード" : `シーン${id}`),
        narration: s.narration,
        narrationDated: s.narrationDated || s.narration,
        narrationEvergreen: s.narrationEvergreen || s.narration,
        heading: s.heading,
        subBadge: s.subBadge || "",
        subtitle: s.subtitle,
        subtitleDated: s.subtitleDated || s.subtitle,
        subtitleEvergreen: s.subtitleEvergreen || s.subtitle,
        textPlacement: s.textPlacement || defaultPlacements[idx] || "center",
        frameStyle: s.frameStyle || defaultFrames[idx] || "makimono",
        bgPrompt:
          s.bgPrompt ||
          "スタイリッシュでモダンなイベント背景映像、滑らかなカメラワークとシネマティック照明、文字なし",
        bgMode: "video",
        audioFile: `generated/scene${id}_audio.wav`,
        bgFile: `generated/scene${id}_bg.mp4`,
        durationInSeconds: estSec,
        durationInFrames: Math.round(estSec * fps),
        ...(id === 4
          ? {
            infoBoard: {
              title: s.infoBoard?.title || s.heading || parsed.title,
              schedules:
                s.infoBoard?.schedules?.length > 0
                  ? s.infoBoard.schedules
                  : ["開催日程はWebページをご確認ください"],
              evergreenSchedules:
                s.infoBoard?.evergreenSchedules?.length > 0
                  ? s.infoBoard.evergreenSchedules
                  : ["毎月開催！最新スケジュールはWebへ"],
              location: s.infoBoard?.location || "CPAバーチャル校",
              target: s.infoBoard?.target || "どなたでも参加大歓迎！",
              ctaText: s.infoBoard?.ctaText || "今すぐお申込みフォームへ！",
              evergreenCtaText:
                s.infoBoard?.evergreenCtaText || "お申込みはフォームから ▶",
            },
          }
          : {}),
      };
    });

    const newScenario = {
      title: parsed.title || "AI自動生成 20秒CM",
      aspectRatio,
      cmType,
      tone,
      visualTheme,
      themeProposalReason,
      fps,
      rawAnnouncement,
      scenes: normalizedScenes,
    };

    pushLog("info", `[テーマ提案] 🎨 ${visualTheme}: ${themeProposalReason}`);
    saveScenario(newScenario);
    res.json({
      scenario: newScenario,
      mode: usedModel,
      message: `${usedModel} で20秒（4カット）CM構成を自動作成しました！`,
    });
  } catch (err) {
    pushLog(
      "error",
      `[CM企画] ❌ AI企画生成失敗、ローカル解析へフォールバックします: ${err.message}`
    );
    const fallback = buildSmartFallbackScenario({
      rawAnnouncement,
      aspectRatio,
      cmType,
      tone,
    });
    saveScenario(fallback);
    res.json({
      scenario: fallback,
      mode: "fallback",
      message: `APIエラー(${err.message})のため、スマート解析モードで構成を作成しました。`,
    });
  }
});

// POST /api/upload-bg (Custom image upload for a scene)
app.post("/api/upload-bg", (req, res) => {
  try {
    const { sceneId, dataUrl, filename } = req.body;
    if (!sceneId || !dataUrl) {
      return res.status(400).json({ error: "画像データが不足しています" });
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "無効な画像フォーマットです" });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const relPath = `generated/scene${sceneId}_custom.${ext}`;
    const fullPath = path.join(PUBLIC_DIR, relPath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    const scenario = readScenario();
    const target = scenario.scenes.find((s) => Number(s.id) === Number(sceneId));
    if (target) {
      target.bgMode = "custom";
      target.bgFile = relPath;
      saveScenario(scenario);
    }

    pushLog("success", `[Scene ${sceneId}] 📁 手元画像 (${filename || relPath}) をアップロード・設定しました`);
    res.json({
      success: true,
      bgFile: relPath,
      filename: filename || path.basename(relPath),
      scenario,
    });
  } catch (err) {
    pushLog("error", `[画像アップロード] ❌ エラー: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/generate-assets (Step 1: Generate TTS audio + backgrounds & determine exact duration)
app.post("/api/generate-assets", async (req, res) => {
  try {
    const {
      scenario,
      onlySceneId = null,
      forceStillMode = false,
      mock = false,
    } = req.body || {};

    if (scenario && Array.isArray(scenario.scenes)) {
      saveScenario(scenario);
    }

    const result = await generateAssets({
      mock: Boolean(mock),
      onlySceneId: onlySceneId !== null ? Number(onlySceneId) : null,
      forceStillMode: Boolean(forceStillMode),
      onLog: (level, msg) => pushLog(level, msg),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    pushLog("error", `[素材生成] ❌ 致命的エラー: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/render (Step 2: Render deterministic MP4 via Remotion CLI)
app.post("/api/render", async (req, res) => {
  try {
    const { scenario } = req.body || {};
    if (scenario && Array.isArray(scenario.scenes)) {
      saveScenario(scenario);
    }

    // Ensure audio & bg files exist for all scenes before rendering
    const current = readScenario();
    for (const s of current.scenes) {
      const audioFull = path.join(PUBLIC_DIR, s.audioFile || `generated/scene${s.id}_audio.wav`);
      const bgFull = path.join(PUBLIC_DIR, s.bgFile || `generated/scene${s.id}_bg.png`);
      if (!fs.existsSync(audioFull) || !fs.existsSync(bgFull)) {
        pushLog("info", `[Render準備] シーン${s.id}の未生成素材を先に生成します...`);
        await generateAssets({
          mock: !hasValidGeminiKey(),
          onlySceneId: s.id,
          onLog: (level, msg) => pushLog(level, msg),
        });
      }
    }

    const finalScenario = readScenario();
    const compositionId =
      finalScenario.aspectRatio === "9:16" ? "CmPortrait" : "CmLandscape";
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outputMp4 = path.join(OUT_DIR, "cm_video.mp4");

    pushLog(
      "info",
      `[Remotion] 🎬 MP4動画レンダリングを開始します: Composition=${compositionId} (${finalScenario.aspectRatio}) -> out/cm_video.mp4`
    );

    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = [
      "remotion",
      "render",
      "src/index.ts",
      compositionId,
      outputMp4,
      "--props=./src/generated-props.json",
    ];

    const renderStart = Date.now();
    let lastLoggedPct = -1;

    await new Promise((resolve, reject) => {
      const child = spawn(npxCmd, args, {
        cwd: ROOT_DIR,
        shell: process.platform === "win32",
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderrLog = "";
      const handleChunk = (chunkText, isErr = false) => {
        const clean = chunkText.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").trim();
        if (!clean) return;
        for (const line of clean.split(/[\r\n]+/)) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // Filter repetitive progress bar updates so log console stays readable
          const frameMatch = trimmed.match(/Rendered\s+(\d+)\/(\d+)/i);
          if (frameMatch) {
            const cur = Number(frameMatch[1]);
            const tot = Number(frameMatch[2]) || 1;
            const pct = Math.floor((cur / tot) * 100);
            if (pct >= lastLoggedPct + 15 || cur === tot) {
              lastLoggedPct = pct;
              pushLog("info", `[Remotion] 🎞️ フレーム描画進捗: ${cur}/${tot} frames (${pct}%)`);
            }
          } else if (
            /Bundled|Cached|Composition|Encoding|Stitching|out\/cm_video\.mp4|Error/i.test(
              trimmed
            )
          ) {
            pushLog(isErr && /Error/i.test(trimmed) ? "error" : "info", `[Remotion] ${trimmed}`);
          }
        }
      };

      child.stdout.on("data", (data) => {
        const text = data.toString();
        process.stdout.write(text);
        handleChunk(text, false);
      });
      child.stderr.on("data", (data) => {
        const text = data.toString();
        stderrLog += text;
        process.stderr.write(text);
        handleChunk(text, true);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Remotionレンダリングがコード ${code} で終了しました: ${stderrLog.slice(-400)}`
            )
          );
        }
      });
    });

    const elapsedRenderSec = ((Date.now() - renderStart) / 1000).toFixed(1);
    const totalSec = finalScenario.scenes
      .reduce((acc, s) => acc + (s.durationInSeconds || 0), 0)
      .toFixed(2);

    pushLog(
      "success",
      `[Remotion] 🎉 MP4動画レンダリング完了！(所要 ${elapsedRenderSec}秒, 動画尺 ${totalSec}秒 -> out/cm_video.mp4)`
    );

    res.json({
      success: true,
      compositionId,
      aspectRatio: finalScenario.aspectRatio,
      totalSeconds: Number(totalSec),
      videoUrl: `/out/cm_video.mp4?t=${Date.now()}`,
    });
  } catch (err) {
    pushLog("error", `[Remotion] ❌ MP4レンダリング失敗: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

function startServer(port, retried = false) {
  const server = app.listen(port, () => {
    console.log(
      `\n========================================================\n` +
        `🚀 20秒CM自動生成スタジオ (Web UI + Remotion) 起動完了！\n` +
        `👉 ブラウザで開く: http://localhost:${port}\n` +
        `🔑 GEMINI_API_KEY: ${
          hasValidGeminiKey()
            ? "設定済み (本番AI生成モード)"
            : "未設定 (自動でモック生成モードにフォールバックします)"
        }\n` +
        `========================================================\n`
    );
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && !retried) {
      console.log(
        `⚠️ ポート ${port} が既存のプロセスで使用中のため、古いプロセスを自動終了して再起動します...`
      );
      try {
        if (process.platform === "win32") {
          execSync(
            `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
            { stdio: "ignore" }
          );
        } else {
          execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
        }
      } catch {
        // Ignore cleanup errors
      }
      setTimeout(() => startServer(port, true), 600);
    } else {
      console.error(`サーバー起動エラー (${err.code}):`, err.message);
      process.exit(1);
    }
  });
}

startServer(PORT);

