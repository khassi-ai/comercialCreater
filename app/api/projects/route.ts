import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ projects: [], assets: [] });
    }

    const supabase = createServiceClient();

    // プロジェクト履歴
    const { data: projects, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // 生成アセット一覧
    const { data: assets, error: aErr } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      projects: projects || [],
      assets: assets || [],
    });
  } catch (err: any) {
    console.error("Get projects API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
