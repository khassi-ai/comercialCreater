"use client";

import React, { useEffect, useState } from "react";
import { X, DollarSign, Zap, Activity, Clock, ShieldCheck } from "lucide-react";

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export const CostModal: React.FC<CostModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [data, setData] = useState<{
    credits: number;
    totalCreditsSpent: number;
    totalCostUsd: number;
    totalCostJpy: number;
    recentLogs: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/user/credits?userId=${userId}`)
        .then((res) => res.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-on-surface">クレジット＆実コスト履歴</h2>
              <p className="text-xs text-on-surface-variant">
                各AIモデル（Gemini・TTS・動画）の消費と推定現金原価
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コストサマリーカード */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[11px] font-semibold text-on-surface-variant block mb-1">
              残りクレジット
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl text-primary">
                {data ? data.credits.toLocaleString() : "9,999"}
              </span>
              <span className="text-xs text-on-surface-variant">pts</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[11px] font-semibold text-on-surface-variant block mb-1">
              累計消費クレジット
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl text-amber-500">
                {data ? data.totalCreditsSpent.toLocaleString() : "0"}
              </span>
              <span className="text-xs text-on-surface-variant">pts</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[11px] font-semibold text-on-surface-variant block mb-1">
              推計現金原価 (USD/円)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-xl text-emerald-500">
                ${data ? data.totalCostUsd : "0.00"}
              </span>
              <span className="text-xs text-on-surface-variant">
                (約¥{data ? data.totalCostJpy : "0"})
              </span>
            </div>
          </div>
        </div>

        {/* 直近の操作ログリスト */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>直近のモデル別実行ログ (Supabase usage_logs 連動)</span>
          </div>

          {!userId ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              ログインすると、操作ごとのクレジットと現金コスト履歴が記録されます
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              履歴を読み込み中...
            </div>
          ) : !data?.recentLogs || data.recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              まだ操作履歴はありません
            </div>
          ) : (
            data.recentLogs.map((log: any, idx: number) => {
              const actionLabel =
                log.action === "scenario_generation"
                  ? "LP解析・台本生成"
                  : log.action === "audio_tts"
                  ? "音声合成 (TTS)"
                  : log.action === "video_background"
                  ? "AI動画背景生成"
                  : log.action;

              return (
                <div
                  key={log.id || idx}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-on-surface">{actionLabel}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-primary font-mono">
                        {log.model_name || "gemini"}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-500">
                      -{log.credits_used} pts
                    </div>
                    <div className="text-[11px] text-emerald-500 font-mono">
                      ${log.cost_usd}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* フッター */}
        <div className="pt-4 border-t border-outline-variant/20 mt-4 flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>SQLで直接 `usage_logs` をクエリすることも可能です</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

