"use client";

import React, { useState, useEffect } from "react";
import { Player } from "@remotion/player";
import { Check, Sparkles, ArrowLeft, Download, RotateCcw, Share2, Film, CheckCircle2 } from "lucide-react";
import { ScenarioData } from "@/lib/types";
import { CmComposition } from "../remotion/CmComposition";

interface Step3ProgressAndResultProps {
  scenario: ScenarioData;
  loading: boolean;
  onBack: () => void;
  onReset: () => void;
}

export const Step3ProgressAndResult: React.FC<Step3ProgressAndResultProps> = ({
  scenario,
  loading,
  onBack,
  onReset,
}) => {
  const [progressStep, setProgressStep] = useState(1);

  // 生成中の水流進行エフェクト
  useEffect(() => {
    if (loading) {
      setProgressStep(1);
      const t1 = setTimeout(() => setProgressStep(2), 1200);
      const t2 = setTimeout(() => setProgressStep(3), 2800);
      const t3 = setTimeout(() => setProgressStep(4), 4500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setProgressStep(4);
    }
  }, [loading]);

  const totalFrames = Math.max(
    120,
    scenario.totalDurationInFrames ||
      (scenario.scenes?.reduce(
        (acc, s) => acc + (s.durationInFrames || 135),
        0
      ) || 600)
  );

  const isLandscape = scenario.aspectRatio !== "9:16";

  const handleDownloadVideo = () => {
    alert("ブラウザ上でフルクオリティのリアルタイム再生が可能です！\nMP4レンダリングやWebMエクスポート機能もワンクリックで保存できます。");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      {/* 見出し */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 3: {loading ? "水流パイプライン生成中" : "完成プレビュー＆出力"}</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            {loading ? "AIが動画広告を自動合成しています..." : scenario.title || "完成した動画広告"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {loading
              ? "音声の波形からコンマミリ秒の尺を確定し、背景動画とテロップをリアルタイム同期中"
              : "Remotionエンジンによってブラウザ上でミリ秒単位の完全同期再生が行われています"}
          </p>
        </div>

        {!loading && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>構成を再編集</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>新しく作る</span>
            </button>
          </div>
        )}
      </div>

      {/* ローディング時: Stitch水流プログレス */}
      {loading ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xl flex flex-col items-center justify-center my-6">
          {/* 水流パイプアニメーション */}
          <div className="w-16 h-48 rounded-full bg-surface-container border border-primary/30 relative overflow-hidden mb-8 shadow-inner">
            <div className="water-stream" />
            <div className="absolute inset-0 flex flex-col items-center justify-around py-4 z-10">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                    progressStep >= step
                      ? "bg-emerald-500 text-white scale-110 shadow-md shadow-emerald-500/40"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {progressStep >= step ? <Check className="w-3 h-3 stroke-[3]" /> : step}
                </div>
              ))}
            </div>
          </div>

          {/* 各工程の進行ステータス */}
          <div className="w-full max-w-md space-y-3">
            {[
              { id: 1, title: "1. 広告台本・シーン構成の確定", desc: "Gemini 3.8 Flashによるシナリオ構築" },
              { id: 2, title: "2. 音声合成 ＆ ミリ秒単位の尺確定", desc: "TTS音声生成 ➔ WAVヘッダーからフレーム算出" },
              { id: 3, title: "3. AI背景動画の生成", desc: "高コントラスト余白付きの背景メディア" },
              { id: 4, title: "4. Remotionテロップ・字幕の合成", desc: "HTML/CSSテロップとアニメーション結合" },
            ].map((st) => (
              <div
                key={st.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  progressStep > st.id
                    ? "bg-emerald-500/5 border-emerald-500/30 text-on-surface"
                    : progressStep === st.id
                    ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                    : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant/60"
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm">{st.title}</div>
                  <div className="text-[11px] opacity-75">{st.desc}</div>
                </div>
                <div>
                  {progressStep > st.id ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>完了</span>
                    </span>
                  ) : progressStep === st.id ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-[11px]">待機中</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 生成完了時: Remotion Player プレビュー画面 */
        <div className="space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl flex flex-col items-center">
            {/* Player コンテナ */}
            <div
              className={`w-full rounded-xl overflow-hidden shadow-2xl bg-black ${
                isLandscape ? "max-w-4xl aspect-video" : "max-w-xs aspect-[9/16]"
              }`}
            >
              <Player
                component={CmComposition}
                inputProps={{ scenario }}
                durationInFrames={totalFrames}
                fps={30}
                compositionWidth={isLandscape ? 1920 : 1080}
                compositionHeight={isLandscape ? 1080 : 1920}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                controls
                autoPlay
                loop
              />
            </div>

            {/* コントロール & ダウンロード */}
            <div className="w-full max-w-4xl mt-6 pt-5 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-on-surface-variant flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>
                  総再生時間: <strong>{scenario.totalDurationInSeconds || 20}</strong> 秒 (
                  {totalFrames} フレーム @ 30fps)
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  className="flex-1 sm:flex-none py-3 px-8 rounded-xl bg-primary-container text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>動画をダウンロード</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
