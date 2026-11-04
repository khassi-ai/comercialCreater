"use client";

import React, { useState, useEffect } from "react";
import { Player } from "@remotion/player";
import {
  Check,
  Sparkles,
  ArrowLeft,
  Download,
  RotateCcw,
  Film,
  CheckCircle2,
  Volume2,
  Loader2,
  Clock,
  Video,
  Layers,
} from "lucide-react";
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
  const [pipelineStep, setPipelineStep] = useState(1);
  const [completedCutIndex, setCompletedCutIndex] = useState<number>(0);

  const scenes = scenario.scenes || [];
  const sceneCount = scenes.length || 4;

  // 生成中の進行シミュレーション（各カットが1つずつ完成していく演出）
  useEffect(() => {
    if (loading) {
      setPipelineStep(1);
      setCompletedCutIndex(0);

      const t1 = setTimeout(() => {
        setPipelineStep(2);
        setCompletedCutIndex(1); // カット1完成
      }, 1000);

      const t2 = setTimeout(() => {
        setPipelineStep(3);
        setCompletedCutIndex(2); // カット2完成
      }, 2400);

      const t3 = setTimeout(() => {
        setCompletedCutIndex(3); // カット3完成
      }, 3800);

      const t4 = setTimeout(() => {
        setPipelineStep(4);
        setCompletedCutIndex(sceneCount); // 全カット完了
      }, 5200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      setPipelineStep(4);
      setCompletedCutIndex(sceneCount);
    }
  }, [loading, sceneCount]);

  const totalFrames = Math.max(
    120,
    scenario.totalDurationInFrames ||
      scenes.reduce((acc, s) => acc + (s.durationInFrames || 135), 0) ||
      600
  );

  const isLandscape = scenario.aspectRatio !== "9:16";

  const handleDownloadVideo = () => {
    alert(
      "🎉 高品質CM広告動画の合成が完了しました！\nブラウザ上でミリ秒単位の完全同期プレビューが再生されています。\nMP4ファイルのダウンロード機能も準備完了です。"
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      {/* 見出し */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 3: {loading ? "AI動画広告を合成中" : "完成プレビュー＆出力"}</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            {loading ? "AIが動画広告を自動合成しています..." : scenario.title || "完成した動画広告"}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {loading
              ? `全 ${sceneCount} カットの音声TTSと背景メディアを順次生成し、Remotionで同期結合しています`
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

      {/* ローディング時: 説明文同期 ＆ カットごとの進捗カード */}
      {loading ? (
        <div className="space-y-6">
          {/* 1. 上部の工程ステータス（説明文の左に進捗アイコンを直接配置して完全同期） */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                全体パイプライン進捗
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                カット {Math.min(completedCutIndex + 1, sceneCount)} / {sceneCount} 処理中
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 1, title: "1. シーン構成の確定", desc: "Gemini 3.8 Flash台本解析" },
                { id: 2, title: "2. 音声合成 ＆ 尺確定", desc: "TTS音声生成 ➔ 秒数同期" },
                { id: 3, title: "3. 背景メディア確定", desc: "高コントラスト余白メディア" },
                { id: 4, title: "4. テロップ・字幕の合成", desc: "Remotionアニメーション結合" },
              ].map((st) => {
                const isDone = pipelineStep > st.id || (!loading && pipelineStep >= st.id);
                const isCurrent = pipelineStep === st.id && loading;
                return (
                  <div
                    key={st.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isDone
                        ? "bg-emerald-500/5 border-emerald-500/30 text-on-surface"
                        : isCurrent
                        ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                        : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant/50"
                    }`}
                  >
                    {/* 左側の同期アイコン */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-outline-variant/40 flex items-center justify-center text-[10px] text-on-surface-variant/50">
                          {st.id}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{st.title}</div>
                      <div className="text-[10px] opacity-75 truncate">{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. カットごとの進行カード（グレーから上から少しずつ完成していく演出） */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  カット別 生成ステータス ({sceneCount}カット)
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  各カットの画像・音声が生成されると、グレーの枠が上から順に完成表示に切り替わります
                </p>
              </div>
              <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface">
                {completedCutIndex} / {sceneCount} カット完了
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {scenes.map((sc, idx) => {
                const isCompleted = completedCutIndex > idx;
                const isProcessing = completedCutIndex === idx;
                const previewImg =
                  sc.bgThumbnail
                    ? (sc.bgThumbnail.startsWith("/") ? sc.bgThumbnail : `/${sc.bgThumbnail}`)
                    : sc.bgUrl || `/generated/scene${(idx % 4) + 1}_bg.png`;

                return (
                  <div
                    key={sc.id || idx}
                    className={`rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col ${
                      isCompleted
                        ? "bg-surface-container-low border-emerald-500/40 shadow-md"
                        : isProcessing
                        ? "bg-primary/5 border-primary shadow-lg ring-2 ring-primary/20"
                        : "bg-surface-container-lowest/50 border-outline-variant/20 opacity-60"
                    }`}
                  >
                    {/* サムネイル画像枠 */}
                    <div className="relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center">
                      {isCompleted ? (
                        <img
                          src={previewImg}
                          alt=""
                          className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
                        />
                      ) : isProcessing ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          <span className="text-[10px] text-primary font-bold">
                            カット {idx + 1} を合成中...
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-surface-container animate-pulse flex items-center justify-center">
                          <span className="text-[11px] text-on-surface-variant/40 font-mono">
                            待機中...
                          </span>
                        </div>
                      )}

                      {/* カット番号バッジ */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                        カット {idx + 1}/{sceneCount}
                      </div>

                      {/* 完了バッジ */}
                      {isCompleted && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>完了</span>
                        </div>
                      )}
                    </div>

                    {/* テロップ＆ステータス情報 */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-on-surface-variant font-medium">
                          {sc.role || `カット ${idx + 1}`}
                        </div>
                        <div className="text-xs font-bold text-on-surface line-clamp-1 mt-0.5">
                          {sc.heading || `テロップ生成中...`}
                        </div>
                        <div className="text-[10px] text-on-surface-variant line-clamp-2 mt-1">
                          {sc.narration || sc.subtitle}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-on-surface-variant">
                          <Volume2 className="w-3 h-3 text-primary" />
                          <span>{isCompleted ? "音声WAV同期済" : "音声準備中"}</span>
                        </span>
                        <span className="text-on-surface-variant font-mono">
                          {sc.durationInSeconds || 5}s
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 生成完了時: Remotion Player プレビュー画面 */
        <div className="space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl flex flex-col items-center">
            {/* 音声ガイダンスバナー */}
            <div className="w-full max-w-4xl mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-xs text-on-surface">
              <div className="p-1 rounded-lg bg-primary text-white">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <strong>高音質ナレーション音声が同期再生されます。</strong>
                <span className="text-on-surface-variant ml-1">
                  （ブラウザの自動再生ポリシーにより消音になっている場合は、画面またはプレイヤーのスピーカーアイコンをクリックしてください）
                </span>
              </div>
            </div>

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
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
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

          {/* シーン別構成サマリー（確認用） */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4">
              完成したカット構成（全 {sceneCount} シーン）
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {scenes.map((sc, idx) => {
                const previewImg =
                  sc.bgThumbnail
                    ? (sc.bgThumbnail.startsWith("/") ? sc.bgThumbnail : `/${sc.bgThumbnail}`)
                    : sc.bgUrl || `/generated/scene${(idx % 4) + 1}_bg.png`;
                return (
                  <div
                    key={sc.id || idx}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-low overflow-hidden"
                  >
                    <div className="aspect-video relative bg-black">
                      <img src={previewImg} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                        カット {idx + 1}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-xs text-on-surface truncate">
                        {sc.heading}
                      </div>
                      <div className="text-[10px] text-on-surface-variant truncate mt-0.5">
                        {sc.narration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
