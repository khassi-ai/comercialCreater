import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
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

    const publicGeneratedDir = path.resolve(process.cwd(), "public", "generated");
    if (!fs.existsSync(publicGeneratedDir)) {
      fs.mkdirSync(publicGeneratedDir, { recursive: true });
    }

    const projectPrefix = projectId ? projectId.slice(0, 8) : Date.now().toString();
    const updatedScenes: SceneData[] = [];
    let totalFrames = 0;
    let totalSeconds = 0;

    // 各シーンを順次生成
    for (let i = 0; i < scenario.scenes.length; i++) {
      const scene = scenario.scenes[i];
      const sceneId = i + 1;

      // 1. TTS 音声生成 ＆ 厳密な秒数・フレーム数算出
      console.log(`[Asset generation] Scene ${sceneId}: Synthesizing TTS audio...`);
      const audioResult = await synthesizeNarrationAudio({
        text: scene.narration,
        voiceType: "energetic",
        sceneId,
      });

      // 音声WAVファイルを public/generated に保存
      const audioRelPath = `generated/proj_${projectPrefix}_s${sceneId}_audio.wav`;
      const audioFullPath = path.join(process.cwd(), "public", audioRelPath);
      if (audioResult.audioBase64.startsWith("data:audio/wav;base64,")) {
        const wavBase64 = audioResult.audioBase64.replace("data:audio/wav;base64,", "");
        fs.writeFileSync(audioFullPath, Buffer.from(wavBase64, "base64"));
      }

      // 2. 背景動画/画像 確定
      const isVideoMode = scene.bgMode === "video";
      let finalBgRelPath = scene.bgThumbnail || scene.bgFile || "";
      let finalBgMode: "video" | "image" = isVideoMode ? "video" : "image";

      if (isVideoMode) {
        // AI動画生成の試行
        const videoRelPath = `generated/proj_${projectPrefix}_s${sceneId}_bg.mp4`;
        const videoFullPath = path.join(process.cwd(), "public", videoRelPath);

        const bgResult = await generateSceneBackgroundMedia({
          bgPrompt: scene.bgPrompt,
          aspectRatio: scenario.aspectRatio || "16:9",
          textPlacement: scene.textPlacement || "center",
          sceneId,
          tone: scenario.tone,
          outputPath: videoFullPath,
        });

        if (bgResult.mode === "video" && fs.existsSync(videoFullPath)) {
          finalBgRelPath = videoRelPath;
          finalBgMode = "video";
        } else if (scene.bgThumbnail && fs.existsSync(path.join(process.cwd(), "public", scene.bgThumbnail))) {
          // 動画生成がフォールバックした場合は、Step 2 で生成された推奨背景画像をそのまま高品質カメラワークで採用
          finalBgRelPath = scene.bgThumbnail;
          finalBgMode = "image";
        }
      } else {
        // 静止画モードの場合: Step 2 の推奨背景画像を使用
        if (scene.bgThumbnail && fs.existsSync(path.join(process.cwd(), "public", scene.bgThumbnail))) {
          finalBgRelPath = scene.bgThumbnail;
        }
        finalBgMode = "image";
      }

      const finalSec = audioResult.durationInSeconds;
      const finalFrames = Math.max(90, Math.round(finalSec * 30));

      totalSeconds += finalSec;
      totalFrames += finalFrames;

      updatedScenes.push({
        ...scene,
        id: sceneId,
        audioFile: audioRelPath,
        bgFile: finalBgRelPath,
        bgThumbnail: scene.bgThumbnail || finalBgRelPath,
        bgUrl: `/${finalBgRelPath}`,
        bgMode: finalBgMode,
        durationInSeconds: finalSec,
        durationInFrames: finalFrames,
      });
    }

    // 3. コスト追跡 ＆ クレジット引き落とし
    await trackUsage({
      userId,
      projectId,
      action: "audio_tts",
      multiplier: scenario.scenes.length,
      details: { sceneCount: scenario.scenes.length },
    });

    const isAnyVideo = scenario.scenes.some((s) => s.bgMode === "video");
    const usageResult = await trackUsage({
      userId,
      projectId,
      action: isAnyVideo ? "video_background" : "video_render",
      multiplier: scenario.scenes.length,
      details: {
        quality: isAnyVideo ? "premium_video" : "economy",
        sceneCount: scenario.scenes.length,
      },
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

      for (const sc of updatedScenes) {
        if (sc.bgFile) {
          await supabase.from("assets").insert({
            user_id: userId,
            project_id: projectId,
            type: sc.bgMode === "video" ? "video" : "image",
            url: `/${sc.bgFile}`,
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
