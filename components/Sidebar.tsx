"use client";

import React, { useState, useEffect } from "react";
import { X, Film, FolderOpen, Image as ImageIcon, Clock, Play } from "lucide-react";
import { ProjectRecord } from "@/lib/types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onSelectProject: (proj: ProjectRecord) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  userId,
  onSelectProject,
}) => {
  const [tab, setTab] = useState<"projects" | "assets">("projects");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/projects?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
          setAssets(data.assets || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* ドロワーパネル */}
      <div className="relative w-80 sm:w-96 max-w-[85vw] h-full bg-surface-container-lowest border-r border-outline-variant/30 shadow-2xl flex flex-col z-10 transition-transform">
        {/* ヘッダー */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-on-surface">ライブラリ & 履歴</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2 p-2 gap-1 bg-surface-container border-b border-outline-variant/10 text-xs font-semibold">
          <button
            onClick={() => setTab("projects")}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              tab === "projects"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>生成プロジェクト</span>
          </button>
          <button
            onClick={() => setTab("assets")}
            className={`py-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${
              tab === "assets"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>素材アセット</span>
          </button>
        </div>

        {/* コンテンツリスト */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!userId ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">
              <p>ログインすると、過去に作成した動画やアセットがここに自動保存されます。</p>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>読み込み中...</span>
            </div>
          ) : tab === "projects" ? (
            projects.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-sm">
                まだ保存されたプロジェクトはありません
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="p-3 rounded-xl border border-outline-variant/30 hover:border-primary/50 bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-on-surface truncate group-hover:text-primary">
                      {proj.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant uppercase">
                      {proj.options?.aspectRatio || "16:9"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">
                    {proj.lp_text}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(proj.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    <span
                      className={`font-medium ${
                        proj.status === "completed" ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {proj.status === "completed" ? "完成" : "下書き"}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : assets.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">
              生成済みのアセット素材はまだありません
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-outline-variant/30 bg-black/40"
                >
                  {asset.type === "video" ? (
                    <video src={asset.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={asset.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
