import { NextRequest, NextResponse } from "next/server";
import { synthesizeNarrationAudio } from "@/lib/ai/tts";
import { generateSceneBackgroundMedia } from "@/lib/ai/video";
import { trackUsage } from "@/lib/usage-tracker";
import { createServiceClient } from "@/lib/supabase/service";
import { ScenarioData, SceneData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario, projectId, userId } = body as {
      scenario: ScenarioData;
      projectId?: string;
      userId: string;
    };

    if (!scenario || !scenario.scenes || scenario.scenes.length === 0) {
      return NextResponse.json(
        { error: "有効なシナリオデータがありません" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 401 }
      );
    }

    const updatedScenes: SceneData[] = [];
    let totalFrames = 0;
    let totalSeconds = 0;

    // 各シーンを順次生成
    for (let i = 0; i < scenario.scenes.length; i++) {
      const scene = scenario.scenes[i];
      const sceneId = i + 1;

      // 1. TTS 音声生成 ＆ 厳密な秒数・フレーム数算出
      const audioResult = await synthesizeNarrationAudio({
        text: scene.narration,
        voiceType: "energetic",
        sceneId,
      });

      // 2. 背景動画/画像 生成
      const bgResult = await generateSceneBackgroundMedia({
        bgPrompt: scene.bgPrompt,
        aspectRatio: scenario.aspectRatio || "16:9",
        textPlacement: scene.textPlacement || "center",
        sceneId,
        tone: scenario.tone,
      });

      const finalSec = audioResult.durationInSeconds;
      const finalFrames = Math.max(90, Math.round(finalSec * 30));

      totalSeconds += finalSec;
      totalFrames += finalFrames;

      updatedScenes.push({
        ...scene,
        id: sceneId,
        audioUrl: audioResult.audioBase64,
        bgUrl: bgResult.mediaUrl,
        bgMode: bgResult.mode,
        durationInSeconds: finalSec,
        durationInFrames: finalFrames,
      });
    }

    // 3. コスト追跡 ＆ クレジット引き落とし
    // 音声TTS: シーン数分 (各15 pts)
    await trackUsage({
      userId,
      projectId,
      action: "audio_tts",
      multiplier: scenario.scenes.length,
      details: { sceneCount: scenario.scenes.length },
    });

    // 背景生成: シーン数分 (各150 pts - Q3: B案)
    const usageResult = await trackUsage({
      userId,
      projectId,
      action: "video_background",
      multiplier: scenario.scenes.length,
      details: { quality: "premium_video", sceneCount: scenario.scenes.length },
    });

    const finalScenario: ScenarioData = {
      ...scenario,
      scenes: updatedScenes,
      totalDurationInSeconds: Number(totalSeconds.toFixed(2)),
      totalDurationInFrames: totalFrames,
    };

    // 4. projects テーブルを completed に更新
    if (projectId) {
      const supabase = createServiceClient();
      await supabase
        .from("projects")
        .update({
          step: 3,
          status: "completed",
          scenario_data: finalScenario,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      // assets テーブルに完成アセットを記録
      for (const sc of updatedScenes) {
        if (sc.bgUrl) {
          await supabase.from("assets").insert({
            user_id: userId,
            project_id: projectId,
            type: sc.bgMode === "video" ? "video" : "image",
            url: sc.bgUrl,
            metadata: { sceneId: sc.id, prompt: sc.bgPrompt },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      scenario: finalScenario,
      remainingCredits: usageResult.remainingCredits,
    });
  } catch (err: any) {
    console.error("Asset generation API error:", err);
    return NextResponse.json(
      { error: err.message || "アセット生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
