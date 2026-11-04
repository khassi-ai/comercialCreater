"use client";

import React from "react";
import { Check, Edit3, FileText, Play } from "lucide-react";

interface StepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  canNavigateToStep2: boolean;
  canNavigateToStep3: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  canNavigateToStep2,
  canNavigateToStep3,
}) => {
  const steps = [
    { number: 1, label: "原稿入力 & 設定", icon: FileText },
    { number: 2, label: "構成確認 & 編集", icon: Edit3 },
    { number: 3, label: "生成 & プレビュー", icon: Play },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4">
      <div className="relative flex items-center justify-between">
        {/* 背景ライン */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-surface-container -z-0" />
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-primary-container transition-all duration-500 -z-0"
          style={{
            width:
              currentStep === 1
                ? "0%"
                : currentStep === 2
                ? "50%"
                : "100%",
          }}
        />

        {steps.map((st) => {
          const isDone = st.number < currentStep;
          const isActive = st.number === currentStep;
          const isClickable =
            st.number === 1 ||
            (st.number === 2 && canNavigateToStep2) ||
            (st.number === 3 && canNavigateToStep3);

          const IconComponent = st.icon;

          return (
            <div key={st.number} className="relative z-10 flex flex-col items-center">
              <button
                disabled={!isClickable}
                onClick={() => onStepClick(st.number as 1 | 2 | 3)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shadow-md ${
                  isDone
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                    : isActive
                    ? "bg-primary-container text-white ring-4 ring-primary/20 scale-105 shadow-primary/30 cursor-pointer"
                    : isClickable
                    ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                    : "bg-surface-container text-outline-variant cursor-not-allowed opacity-60"
                }`}
              >
                {isDone ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </button>
              <span
                className={`mt-2 text-xs font-semibold tracking-tight transition-colors ${
                  isActive
                    ? "text-primary font-bold"
                    : isDone
                    ? "text-on-surface"
                    : "text-on-surface-variant"
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
