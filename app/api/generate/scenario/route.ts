import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { generateScenarioFromLp } from "@/lib/ai/gemini";
import { generateSceneBackgroundImage } from "@/lib/ai/image";
import { trackUsage } from "@/lib/usage-tracker";
import { createServiceClient } from "@/lib/supabase/service";
import { ProjectOptions, SceneData } from "@/lib/types";

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

    const publicGeneratedDir = path.resolve(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGeneratedDir)) {
      fs.mkdirSync(publicGeneratedDir, { recursive: true });
    }

    // 1. Gemini 3.8 Flash でLPを解析しシーン構成を企画・生成
    const scenario = await generateScenarioFromLp({ lpText, options });
    const timestamp = Date.now();
    const isVideo = options.quality === "premium_video";

    // 2. 各カットの推奨背景画像（キービジュアル）をAI生成
    //    Step 2でユーザーに提示し、動画生成プロンプトの元画像として使用
    const scenesWithImages: SceneData[] = [];
    for (let idx = 0; idx < scenario.scenes.length; idx++) {
      const sc = scenario.scenes[idx];
      const sceneId = idx + 1;
      const imgFileName = `gen_${timestamp}_s${sceneId}_thumb.png`;
      const imgRelPath = `generated/${imgFileName}`;
      const imgFullPath = path.join(publicGeneratedDir, imgFileName);

      let hasCustomImage = false;
      try {
        const imgResult = await generateSceneBackgroundImage({
          bgPrompt: sc.bgPrompt,
          aspectRatio: scenario.aspectRatio || "16:9",
          textPlacement: sc.textPlacement || "center",
          visualTheme: scenario.visualTheme,
          sceneId,
        });
        fs.writeFileSync(imgFullPath, imgResult.imageBuffer);
        hasCustomImage = true;
      } catch (imgErr) {
        console.warn(`[Scenario image generation] scene ${sceneId} fallback:`, imgErr);
      }

      const finalRelPath = hasCustomImage ? imgRelPath : `generated/scene${(idx % 4) + 1}_bg.png`;
      const finalUrl = `/${finalRelPath}`;

      scenesWithImages.push({
        ...sc,
        id: sceneId,
        bgThumbnail: finalRelPath,
        bgUrl: finalUrl,
        bgFile: isVideo ? `generated/gen_${timestamp}_s${sceneId}_bg.mp4` : finalRelPath,
        bgMode: isVideo ? "video" : "image",
        frameStyle: sc.frameStyle || (scenario.visualTheme === "dojo-scroll" ? (idx % 2 === 0 ? "makimono" : "byobu") : "glass"),
      });
    }

    scenario.scenes = scenesWithImages;

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

