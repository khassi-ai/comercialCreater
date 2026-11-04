"use client";

import React, { useState } from "react";
import { Sparkles, Clipboard, CheckCircle, Video, Smartphone, Monitor, Shield, Layers, Mic } from "lucide-react";
import { ProjectOptions } from "@/lib/types";

interface Step1InputProps {
  lpText: string;
  setLpText: (val: string) => void;
  options: ProjectOptions;
  setOptions: (opts: ProjectOptions) => void;
  onSubmit: () => void;
  loading: boolean;
}

const SAMPLE_LP_TEXT = `【新登場】次世代AI動画広告ジェネレーター
ランディングページの文章を貼り付けるだけで、わずか30秒で売れるショート動画広告を自動生成！
・最新のGemini 3.8 AIが視聴者を惹きつける「4カット黄金構成」を自動企画
・ハイクオリティなAI動画背景と自然な音声ナレーションを自動合成
・YouTube広告、Instagramリール、TikTok広告に即座に活用可能
短納期・低コストでテストマーケティングを加速させたいマーケター・企業様必見！
今なら初期9,999クレジットプレゼント中！今すぐ無料でお試しください。`;

export const Step1Input: React.FC<Step1InputProps> = ({
  lpText,
  setLpText,
  options,
  setOptions,
  onSubmit,
  loading,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLpText(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {
      // クリップボード読み取り失敗時は通常ペーストを促す
    }
  };

  const loadSample = () => {
    setLpText(SAMPLE_LP_TEXT);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      {/* メインカード */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl p-6 sm:p-8 transition-colors">
        {/* 見出し */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 1: 原稿入力</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            LPの文章・告知テキストを入力
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
            URLの取得は行わず、テキストをそのままGemini APIが解析して成果の出るCM構成を作成します。
          </p>
        </div>

        {/* テキストエリア & ツールバー */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
              LPテキスト / キャッチコピー / 訴求文
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSample}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                サンプル原稿を入力
              </button>
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-semibold transition-colors cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{pasteSuccess ? "貼り付け完了！" : "クリップボードから貼付"}</span>
              </button>
            </div>
          </div>

          <textarea
            value={lpText}
            onChange={(e) => setLpText(e.target.value)}
            rows={7}
            placeholder="ここにLPの文章、サービスの特徴、イベント告知文などを貼り付けてください..."
            className="w-full p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface text-sm sm:text-base leading-relaxed focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 transition-all resize-y"
          />
          <div className="text-right mt-1 text-[11px] text-on-surface-variant">
            {lpText.length} 文字入力中
          </div>
        </div>

        {/* オプション設定チップ群 */}
        <div className="pt-4 border-t border-outline-variant/20 space-y-5">
          <span className="text-xs font-bold text-on-surface tracking-wider uppercase block">
            動画の仕様・トーン設定
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. 画面アスペクト比 (Q2: 16:9 デフォルト) */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1.5">
                アスペクト比
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-container">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, aspectRatio: "16:9" })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    options.aspectRatio === "16:9"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 横型</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, aspectRatio: "9:16" })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    options.aspectRatio === "9:16"
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 縦型</span>
                </button>
              </div>
            </div>

            {/* 2. カット数 (デフォルト: 4カット) */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1.5">
                カット数 (尺)
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-container">
                {([3, 4, 5] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setOptions({ ...options, sceneCount: cnt })}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      options.sceneCount === cnt
                        ? "bg-surface-container-lowest text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {cnt}カット
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 音声トーン */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1.5">
                ナレーショントーン
              </label>
              <select
                value={options.voiceType}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    voiceType: e.target.value as any,
                  })
                }
                className="w-full py-2.5 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:border-primary"
              >
                <option value="energetic">🔥 元気・情熱的 (Puck)</option>
                <option value="professional">💼 信頼・ビジネス (Aoede)</option>
                <option value="calm">🍵 落ち着き・親しみ (Charon)</option>
              </select>
            </div>

            {/* 4. 背景画質 (静止画 vs AI動画) */}
            <div>
              <label className="text-[11px] font-semibold text-on-surface-variant block mb-1.5">
                背景素材品質
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-container">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, quality: "economy" })}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    options.quality === "economy"
                      ? "bg-white dark:bg-[#151926] text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span>🖼️ 静止画</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, quality: "premium_video" })}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    options.quality === "premium_video"
                      ? "bg-white dark:bg-[#151926] text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>AI動画</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA トレイ */}
        <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              消費予定クレジット:{" "}
              <strong className="text-on-surface text-sm font-bold">20</strong> pts (台本解析)
            </span>
          </div>

          <button
            type="button"
            disabled={loading || !lpText.trim()}
            onClick={onSubmit}
            className={`w-full sm:w-auto h-12 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
              !lpText.trim() || loading
                ? "bg-surface-container text-outline-variant cursor-not-allowed opacity-70"
                : "bg-primary-container text-white hover:bg-primary-hover shadow-primary/25 hover:shadow-primary/35"
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Geminiが構成案を企画中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>構成案をAI生成する (Step 2へ ➔)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* フッター補足 */}
      <div className="mt-4 px-2 flex items-center justify-between text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>入力したテキストは広告生成のみに利用され、外部学習には使用されません</span>
        </div>
        <div>
          <span>1カット約5秒 / 4カットで約20秒の動画を構成</span>
        </div>
      </div>
    </div>
  );
};

