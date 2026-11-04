"use client";

import React from "react";
import { Sparkles, Moon, Sun, User, Menu, Zap } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSidebar: () => void;
  onOpenCostModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  projectTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenSidebar,
  onOpenCostModal,
  isDark,
  onToggleDark,
  projectTitle = "無題の広告動画",
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* 左: メニューボタン & ロゴ */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title="履歴とアセットを開く"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-on-surface">
                Lumen Ad <span className="text-primary-container">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                Vercel Studio
              </span>
            </div>
          </div>
        </div>

        {/* 中央: プロジェクトタイトル */}
        <div className="hidden md:flex items-center text-sm font-medium text-on-surface-variant max-w-[280px] truncate">
          <span className="truncate">{projectTitle}</span>
        </div>

        {/* 右: クレジットバッジ & ダーク切替 & 認証 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* クレジット残高バッジ (クリックでコスト詳細) */}
          <button
            onClick={onOpenCostModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all text-xs sm:text-sm font-bold shadow-sm"
            title="クレジット残高と現金コスト履歴を確認"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{user ? user.credits.toLocaleString() : "9,999"}</span>
            <span className="hidden sm:inline text-xs font-normal text-on-surface-variant">pts</span>
          </button>

          {/* ダークモード切替 */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title={isDark ? "ライトモードに切替" : "ダークモードに切替"}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* ユーザーアカウント / ログイン */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user.email ? user.email.slice(0, 2) : "ME"}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-white hover:bg-primary-hover font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <User className="w-4 h-4" />
              <span>ログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
