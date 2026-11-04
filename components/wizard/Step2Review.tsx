"use client";

import React from "react";
import { ArrowLeft, Play, Sparkles, Video, Volume2, Edit3, CheckCircle2 } from "lucide-react";
import { ScenarioData, SceneData } from "@/lib/types";

interface Step2ReviewProps {
  scenario: ScenarioData;
  setScenario: (sc: ScenarioData) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  isGeneratingScenario?: boolean;
}

export const Step2Review: React.FC<Step2ReviewProps> = ({
  scenario,
  setScenario,
  onBack,
  onSubmit,
  loading,
  isGeneratingScenario = false,
}) => {
  const handleSceneChange = (
    index: number,
    field: keyof SceneData,
    value: string
  ) => {
    const nextScenes = [...scenario.scenes];
    nextScenes[index] = {
      ...nextScenes[index],
      [field]: value,
    };
    setScenario({ ...scenario, scenes: nextScenes });
  };

  const estimatedTotalCredits = (scenario.scenes?.length || 4) * (15 + 150); // TTS + AI動画

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 animate-in fade-in duration-300 relative">
      {/* AI構成案 先行遷移時の生成中レイヤー（操作不可 ＆ スケルトンが埋まっていく体験） */}
      {isGeneratingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-surface-container-lowest border border-primary/30 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-bounce">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-2">
                <span>Gemini 3.8 Flash 起動中</span>
              </div>
              <h3 className="text-xl font-bold font-display text-on-surface">
                CMストーリーボードを企画・構成中...
              </h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                LPの訴求ポイント・ターゲットの心理動線を徹底分析し、
                成約率を最大化する{scenario.scenes.length || 4}つのカット構成を組み立てています。
              </p>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
            </div>
            <div className="text-[11px] text-primary font-semibold flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>構成カードを順次展開中（まもなく完了します）</span>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー情報 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 2: 構成案の確認・編集</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            AIが生成したCMストーリーボード
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            各シーンのテロップやナレーションは直接編集できます。問題なければ動画生成へ進んでください。
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>原稿入力に戻る</span>
        </button>
      </div>

      {/* 企画提案理由バナー */}
      {scenario.themeProposalReason && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs sm:text-sm leading-relaxed text-on-surface">
            <strong className="font-bold text-primary block mb-0.5">
              演出ディレクション方針
            </strong>
            {scenario.themeProposalReason}
          </div>
        </div>
      )}

      {/* ストーリーボード（カード一覧） */}
      <div className="space-y-4 mb-8">
        {scenario.scenes.map((scene, idx) => (
          <div
            key={scene.id || idx}
            className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md hover:border-primary/40 transition-all flex flex-col lg:flex-row gap-5"
          >
            {/* 左側: サムネイル & 役割バッジ */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-white text-[11px] font-bold">
                  カット {idx + 1}: {scene.role || `シーン ${idx + 1}`}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  想定 {scene.durationInSeconds || 5}秒
                </span>
              </div>

              {/* プレビュー枠 */}
              {(() => {
                const previewImg =
                  scene.bgThumbnail
                    ? (scene.bgThumbnail.startsWith("/") ? scene.bgThumbnail : `/${scene.bgThumbnail}`)
                    : scene.bgUrl ||
                      (scene.bgFile?.endsWith(".png")
                        ? (scene.bgFile.startsWith("/") ? scene.bgFile : `/${scene.bgFile}`)
                        : `/generated/scene${(idx % 4) + 1}_bg.png`);
                return (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant/30 bg-black/70 flex items-center justify-center group shadow-md">
                    <img
                      src={previewImg}
                      alt={`カット ${idx + 1} 背景`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/generated/scene${(idx % 4) + 1}_bg.png`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                      {scenario.aspectRatio || "16:9"}
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      {scene.bgMode === "video" ? (
                        <>
                          <Video className="w-3 h-3" />
                          <span>AI動画</span>
                        </>
                      ) : (
                        <span>🖼️ 静止画</span>
                      )}
                    </div>

                    <div className="absolute bottom-1.5 inset-x-2 text-[10px] text-white/90 truncate font-mono bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                      {scene.bgPrompt || "AI背景メディア"}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 右側: テロップ・ナレーション・字幕エディタ */}
            <div className="flex-1 space-y-3.5">
              {/* テロップ見出し */}
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 mb-1">
                  <Edit3 className="w-3 h-3 text-primary" />
                  <span>メイン見出しテロップ（画面に大きく出る文字）</span>
                </label>
                <input
                  type="text"
                  value={scene.heading}
                  onChange={(e) => handleSceneChange(idx, "heading", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-bold text-sm sm:text-base focus:outline-none focus:border-primary"
                />
              </div>

              {/* サブバッジ & 字幕 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    補足サブバッジ（上部に小さく表示）
                  </label>
                  <input
                    type="text"
                    value={scene.subBadge || ""}
                    onChange={(e) => handleSceneChange(idx, "subBadge", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-on-surface-variant block mb-1">
                    字幕テキスト（画面下部）
                  </label>
                  <input
                    type="text"
                    value={scene.subtitle}
                    onChange={(e) => handleSceneChange(idx, "subtitle", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* ナレーション（読み上げ原稿） */}
              <div>
                <label className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1 mb-1">
                  <Volume2 className="w-3 h-3 text-emerald-500" />
                  <span>ナレーション読み上げ原稿</span>
                </label>
                <textarea
                  rows={2}
                  value={scene.narration}
                  onChange={(e) => handleSceneChange(idx, "narration", e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ボトムCTAバー */}
      <div className="sticky bottom-4 z-20 p-4 sm:p-5 rounded-2xl bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>
            予定消費:{" "}
            <strong className="text-on-surface font-bold text-sm">
              {estimatedTotalCredits}
            </strong>{" "}
            pts (音声TTS + AI動画背景生成)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 sm:flex-none py-3 px-5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-on-surface transition-colors cursor-pointer"
          >
            修正する
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="flex-1 sm:flex-none py-3 px-8 rounded-xl bg-primary-container text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>動画生成を開始中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>この構成で動画を生成する (Step 3へ ➔)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

