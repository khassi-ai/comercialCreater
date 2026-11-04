export type AspectRatio = "16:9" | "9:16";

export type SceneRole = "フック" | "問題提起" | "解決策・ベネフィット" | "信頼・実績" | "CTA・行動喚起";

export interface SceneData {
  id: number;
  role: string;
  narration: string;
  heading: string;
  subBadge?: string;
  subtitle: string;
  bgPrompt: string;
  bgMode?: "video" | "image" | "custom";
  textPlacement?: "center" | "left" | "right";
  frameStyle?: "makimono" | "byobu" | "glass" | "modern";
  audioUrl?: string;
  bgUrl?: string;
  durationInSeconds: number;
  durationInFrames: number;
  infoBoard?: {
    title: string;
    schedules: Array<{ label: string; date: string }>;
    ctaText: string;
  };
}

export interface ScenarioData {
  title: string;
  aspectRatio: AspectRatio;
  cmType: "dated" | "evergreen";
  tone: "passionate" | "smart" | "friendly";
  visualTheme: "dojo-scroll" | "cyber-impact" | "pop-campus" | "corporate";
  themeProposalReason?: string;
  fps: number;
  rawAnnouncement?: string;
  scenes: SceneData[];
  totalDurationInSeconds?: number;
  totalDurationInFrames?: number;
}

export interface ProjectOptions {
  sceneCount: 3 | 4 | 5;
  aspectRatio: AspectRatio;
  voiceType: "energetic" | "professional" | "calm";
  quality: "economy" | "premium_video"; // B案: AI動画生成
  tone: "passionate" | "smart" | "friendly";
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  title: string;
  lp_text: string;
  options: ProjectOptions;
  step: 1 | 2 | 3;
  status: "draft" | "generating" | "completed" | "failed";
  scenario_data: ScenarioData | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  plan_tier: string;
}

export interface UsageLogRecord {
  id?: string;
  user_id: string;
  project_id?: string | null;
  action: "scenario_generation" | "audio_tts" | "video_background" | "video_render";
  credits_used: number;
  cost_usd: number;
  model_name?: string;
  details?: Record<string, any>;
  created_at?: string;
}

