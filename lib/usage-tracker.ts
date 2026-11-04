import { createServiceClient } from "./supabase/service";
import { UsageLogRecord } from "./types";

export const ACTION_COSTS = {
  scenario_generation: {
    credits: 20,
    cost_usd: 0.0025,
    model: "gemini-3.8-flash",
  },
  audio_tts: {
    credits: 15,
    cost_usd: 0.0006,
    model: "gemini-tts-audio",
  },
  video_background: {
    credits: 150,
    cost_usd: 0.035,
    model: "gemini-omni-1.1-flash",
  },
  video_render: {
    credits: 10,
    cost_usd: 0.001,
    model: "remotion-browser-render",
  },
} as const;

/**
 * 操作に応じたクレジット消費と原価（USD）の記録を行う
 */
export async function trackUsage({
  userId,
  projectId,
  action,
  multiplier = 1,
  details = {},
}: {
  userId: string;
  projectId?: string | null;
  action: keyof typeof ACTION_COSTS;
  multiplier?: number; // シーン数など
  details?: Record<string, any>;
}): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  try {
    const supabase = createServiceClient();
    const costConfig = ACTION_COSTS[action];
    const totalCredits = costConfig.credits * multiplier;
    const totalCostUsd = Number((costConfig.cost_usd * multiplier).toFixed(6));

    // 1. 現在のクレジット残高確認
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.warn(`User profile not found for ${userId}, continuing with tracking only`);
    }

    const currentCredits = profile?.credits ?? 9999;
    const newCredits = Math.max(0, currentCredits - totalCredits);

    // 2. profiles のクレジット残高を更新
    if (profile) {
      await supabase
        .from("profiles")
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    // 3. usage_logs に詳細をインサート
    const logEntry: UsageLogRecord = {
      user_id: userId,
      project_id: projectId || null,
      action,
      credits_used: totalCredits,
      cost_usd: totalCostUsd,
      model_name: costConfig.model,
      details: {
        ...details,
        multiplier,
        timestamp: new Date().toISOString(),
      },
    };

    const { error: logErr } = await supabase.from("usage_logs").insert(logEntry);
    if (logErr) {
      console.error("Failed to insert usage log:", logErr);
    }

    return {
      success: true,
      remainingCredits: newCredits,
    };
  } catch (err: any) {
    console.error("trackUsage error:", err);
    return {
      success: false,
      remainingCredits: 9999,
      error: err.message,
    };
  }
}
