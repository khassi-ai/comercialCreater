"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AuthModal } from "@/components/AuthModal";
import { CostModal } from "@/components/CostModal";
import { Stepper } from "@/components/wizard/Stepper";
import { Step1Input } from "@/components/wizard/Step1Input";
import { Step2Review } from "@/components/wizard/Step2Review";
import { Step3ProgressAndResult } from "@/components/wizard/Step3ProgressAndResult";
import { createClient } from "@/lib/supabase/client";
import { ScenarioData, ProjectOptions, ProjectRecord, UserProfile } from "@/lib/types";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);

  // ウィザード状態
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [lpText, setLpText] = useState("");
  const [options, setOptions] = useState<ProjectOptions>({
    sceneCount: 4,
    aspectRatio: "16:9",
    voiceType: "energetic",
    quality: "premium_video", // Q3: B案 AI動画
    tone: "passionate",
  });

  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [loadingScenario, setLoadingScenario] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const pendingGenerateRef = useRef(false);

  // ダークモード初期化
  useEffect(() => {
    const isDarkStored = localStorage.getItem("theme") === "dark";
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Supabase 認証セッション監視 & クレジット残高読み込み
  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const res = await fetch(`/api/user/credits?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser({
          id: userId,
          email,
          credits: data.credits ?? 9999,
          plan_tier: "free",
        });
      }
    } catch (e) {
      console.error("fetchUserProfile error:", e);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || "");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || "");
        // ログイン待ちだった場合は自動でStep 2の生成へ進む
        if (pendingGenerateRef.current) {
          pendingGenerateRef.current = false;
          executeScenarioGeneration(session.user.id);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Step 1 提出: 未ログインならログインモーダルを開き、ログイン後に自動生成
  const handleStep1Submit = () => {
    if (!lpText.trim()) return;

    if (!user) {
      pendingGenerateRef.current = true;
      setShowAuthModal(true);
      return;
    }

    executeScenarioGeneration(user.id);
  };

  // 実際のシナリオ生成API呼び出し（先行遷移 ＆ スケルトン表示）
  const executeScenarioGeneration = async (userId: string) => {
    // 1. 先行遷移用のプレースホルダーを作成して即座にStep 2へ
    const count = options.sceneCount || 4;
    const placeholderScenes = Array.from({ length: count }).map((_, i) => ({
      id: i + 1,
      role:
        i === 0
          ? "フック"
          : i === count - 1
          ? "CTA"
          : `ポイント ${i}`,
      durationInSeconds: 5,
      durationInFrames: 150,
      heading: "AIがテロップを考案中...",
      subBadge: "分析中",
      subtitle: "LPのテキストを解析して最適なテロップを設計しています...",
      narration: "最適なナレーション原稿を生成しています...",
      bgThumbnail: `generated/scene${(i % 4) + 1}_bg.png`,
      bgUrl: `/generated/scene${(i % 4) + 1}_bg.png`,
      bgFile:
        options.quality === "premium_video"
          ? `generated/scene${(i % 4) + 1}_bg.mp4`
          : `generated/scene${(i % 4) + 1}_bg.png`,
      bgMode: (options.quality === "premium_video" ? "video" : "image") as any,
      bgPrompt: "高解像度背景メディアを計画中...",
      textPlacement: "center" as const,
    }));

    setScenario({
      title: "AI広告台本を考案中...",
      aspectRatio: options.aspectRatio,
      cmType: "dated",
      tone: options.tone,
      visualTheme: "dojo-scroll",
      fps: 30,
      scenes: placeholderScenes,
    });
    setLoadingScenario(true);
    setCurrentStep(2); // ★即座にStep 2へ先行遷移

    try {
      const res = await fetch("/api/generate/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lpText,
          options,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "シナリオの生成に失敗しました");
      }

      setScenario(data.scenario);
      setCurrentProjectId(data.projectId);
      if (data.remainingCredits !== undefined && user) {
        setUser({ ...user, credits: data.remainingCredits });
      }
    } catch (err: any) {
      alert(err.message || "エラーが発生しました");
      setCurrentStep(1); // 失敗時はStep 1に戻す
    } finally {
      setLoadingScenario(false);
    }
  };

  // Step 2 提出: 各カットの音声TTS ＋ AI動画背景生成を行い Step 3 へ
  const handleStep2Submit = async () => {
    if (!scenario || !user) return;

    setLoadingAssets(true);
    setCurrentStep(3); // 先に水流プログレス画面を表示

    try {
      const res = await fetch("/api/generate/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          projectId: currentProjectId,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "動画アセットの生成に失敗しました");
      }

      setScenario(data.scenario);
      if (data.remainingCredits !== undefined) {
        setUser({ ...user, credits: data.remainingCredits });
      }
    } catch (err: any) {
      alert(err.message || "生成中にエラーが発生しました");
      setCurrentStep(2); // エラー時はStep 2に戻る
    } finally {
      setLoadingAssets(false);
    }
  };

  // 過去プロジェクト読み込み
  const handleSelectProject = (proj: ProjectRecord) => {
    setLpText(proj.lp_text);
    if (proj.options) setOptions(proj.options);
    if (proj.scenario_data) {
      setScenario(proj.scenario_data);
      setCurrentProjectId(proj.id);
      setCurrentStep(proj.step === 3 && proj.status === "completed" ? 3 : 2);
    } else {
      setCurrentStep(1);
    }
  };

  const handleReset = () => {
    setLpText("");
    setScenario(null);
    setCurrentProjectId(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface transition-colors">
      {/* グローバルヘッダー */}
      <Header
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSidebar={() => setShowSidebar(true)}
        onOpenCostModal={() => setShowCostModal(true)}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
        projectTitle={scenario?.title}
      />

      {/* 3ステップナビゲーション */}
      <Stepper
        currentStep={currentStep}
        onStepClick={(st) => setCurrentStep(st)}
        canNavigateToStep2={Boolean(scenario)}
        canNavigateToStep3={Boolean(scenario && currentStep === 3)}
      />

      {/* メインコンテンツエリア */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1Input
            lpText={lpText}
            setLpText={setLpText}
            options={options}
            setOptions={setOptions}
            onSubmit={handleStep1Submit}
            loading={loadingScenario}
          />
        )}

        {currentStep === 2 && scenario && (
          <Step2Review
            scenario={scenario}
            setScenario={setScenario}
            onBack={() => setCurrentStep(1)}
            onSubmit={handleStep2Submit}
            loading={loadingAssets}
            isGeneratingScenario={loadingScenario}
          />
        )}

        {currentStep === 3 && scenario && (
          <Step3ProgressAndResult
            scenario={scenario}
            loading={loadingAssets}
            onBack={() => setCurrentStep(2)}
            onReset={handleReset}
          />
        )}
      </main>

      {/* 引き出しサイドバー */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        userId={user?.id || null}
        onSelectProject={handleSelectProject}
      />

      {/* ログイン・新規登録モーダル */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          pendingGenerateRef.current = false;
        }}
        onSuccess={(loggedUser) => {
          fetchUserProfile(loggedUser.id, loggedUser.email || "");
          if (pendingGenerateRef.current) {
            pendingGenerateRef.current = false;
            executeScenarioGeneration(loggedUser.id);
          }
        }}
      />

      {/* クレジット＆現金コスト履歴モーダル */}
      <CostModal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        userId={user?.id || null}
      />
    </div>
  );
}

