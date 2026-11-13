"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Moon,
  Sun,
  User,
  Menu,
  Zap,
  LogOut,
  History,
  CreditCard,
  Mail,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { UserProfile } from "@/lib/types";

interface HeaderProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSidebar: () => void;
  onOpenCostModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  projectTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenSidebar,
  onOpenCostModal,
  isDark,
  onToggleDark,
  projectTitle = "無題の広告動画",
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuOpen]);

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
            title="クレジット残高と現金コスト履歴を確認"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{user ? user.credits.toLocaleString() : "9,999"}</span>
            <span className="hidden sm:inline text-xs font-normal text-on-surface-variant">pts</span>
          </button>

          {/* ダークモード切替 */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title={isDark ? "ライトモードに切替" : "ダークモードに切替"}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* ユーザーアカウント / ログイン */}
          {user ? (
            <div className="relative pl-1" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-label="アカウントメニューを開く"
                className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-outline-variant/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user.email ? user.email.slice(0, 2) : "ME"}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#151926] border border-outline-variant/40 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* アカウント情報ヘッダー */}
                  <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                        {user.email ? user.email.slice(0, 2) : "ME"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-on-surface">
                            ログイン中
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{user.plan_tier === "free" ? "Free" : user.plan_tier}</span>
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{user.email || "ユーザー"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 保有クレジット & ID */}
                    <div className="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">保有クレジット</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {user.credits.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant">アカウントID</span>
                      <span className="font-mono text-on-surface-variant">
                        {user.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* メニューアクション */}
                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenCostModal();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>クレジット・原価コスト履歴</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSidebar();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <History className="w-4 h-4 text-primary" />
                      <span>生成プロジェクト・素材履歴</span>
                    </button>
                  </div>

                  {/* ログアウト */}
                  <div className="p-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ログアウト</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-white hover:bg-primary-hover font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
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
