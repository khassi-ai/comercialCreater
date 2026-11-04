import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. プロファイル（クレジット残高）
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, email, plan_tier")
      .eq("id", userId)
      .single();

    // 2. 利用履歴（直近10件）
    const { data: logs } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. 総利用額の集計
    const { data: allLogs } = await supabase
      .from("usage_logs")
      .select("credits_used, cost_usd")
      .eq("user_id", userId);

    let totalCreditsSpent = 0;
    let totalCostUsd = 0;

    if (allLogs) {
      for (const log of allLogs) {
        totalCreditsSpent += log.credits_used || 0;
        totalCostUsd += Number(log.cost_usd || 0);
      }
    }

    return NextResponse.json({
      credits: profile?.credits ?? 9999,
      email: profile?.email || "",
      totalCreditsSpent,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostJpy: Math.round(totalCostUsd * 155),
      recentLogs: logs || [],
    });
  } catch (err: any) {
    console.error("Get credits API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
