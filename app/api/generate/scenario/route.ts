import { NextRequest, NextResponse } from "next/server";
import { generateScenarioFromLp } from "@/lib/ai/gemini";
import { trackUsage } from "@/lib/usage-tracker";
import { createServiceClient } from "@/lib/supabase/service";
import { ProjectOptions } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lpText, options, userId } = body as {
      lpText: string;
      options: ProjectOptions;
      userId: string;
    };

    if (!lpText || !lpText.trim()) {
      return NextResponse.json(
        { error: "LPテキストが入力されていません" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です（未ログイン）" },
        { status: 401 }
      );
    }

    // 1. Gemini 3.8 Flash でLPを解析しシーン構成を企画・生成
    const scenario = await generateScenarioFromLp({ lpText, options });

    // 各カットに初期サムネイル画像ファイルとモードを設定
    scenario.scenes = scenario.scenes.map((sc, idx) => {
      const fileNum = (idx % 4) + 1;
      const isVideo = options.quality === "premium_video";
      return {
        ...sc,
        id: idx + 1,
        bgFile: isVideo ? `generated/scene${fileNum}_bg.mp4` : `generated/scene${fileNum}_bg.png`,
        bgThumbnail: `generated/scene${fileNum}_bg.png`,
        bgUrl: `/generated/scene${fileNum}_bg.png`,
        bgMode: isVideo ? "video" : "image",
        audioFile: `generated/scene${fileNum}_audio.wav`,
        frameStyle: sc.frameStyle || (scenario.visualTheme === "dojo-scroll" ? (idx % 2 === 0 ? "makimono" : "byobu") : "glass"),
      };
    });

    // 2. コスト追跡 ＆ クレジット引き落とし (scenario_generation: 20 pts)
    const usageResult = await trackUsage({
      userId,
      action: "scenario_generation",
      multiplier: 1,
      details: {
        sceneCount: scenario.scenes.length,
        aspectRatio: options.aspectRatio,
        lpLength: lpText.length,
      },
    });

    // 3. projects テーブルに保存
    const supabase = createServiceClient();
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title: scenario.title || "AI動画広告",
        lp_text: lpText,
        options,
        step: 2,
        status: "draft",
        scenario_data: scenario,
      })
      .select()
      .single();

    if (projErr) {
      console.error("Failed to insert project record:", projErr);
    }

    return NextResponse.json({
      success: true,
      scenario,
      projectId: project?.id || null,
      remainingCredits: usageResult.remainingCredits,
    });
  } catch (err: any) {
    console.error("Scenario generation API error:", err);
    return NextResponse.json(
      { error: err.message || "シナリオ生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

