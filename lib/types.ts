export type AspectRatio = "16:9" | "9:16";
export type CmType = "dated" | "evergreen";
export type CmTone = "passionate" | "smart" | "friendly";
export type BgMode = "image" | "video" | "custom";

export type VisualTheme =
  | "dojo-scroll"      // 🏯 和風道場・巻物＆金屏風（明朝・毛筆調フォント）
  | "cyber-impact"     // ⚡ サイバー・インパクト（超極太ゴシックフォント）
  | "corporate-smart"  // 💎 王道ビジネス・スマート（洗練ゴシックフォント）
  | "pop-campus";      // 🌈 ポップ＆キャンパス（丸みポップフォント）

export type TextPlacement = "center" | "left" | "right";
export type FrameStyle = "makimono" | "byobu" | "glass";

export interface InfoBoardData {
  title?: string;
  schedules: string[];
  evergreenSchedules?: string[];
  location: string;
  target: string;
  ctaText: string;
  evergreenCtaText?: string;
}

export interface SceneData {
  id: number;
  role: string;
  narration: string;
  narrationDated?: string;
  narrationEvergreen?: string;
  heading: string;
  subBadge?: string;
  subtitle: string;
  subtitleDated?: string;
  subtitleEvergreen?: string;
  bgPrompt: string;
  bgMode: BgMode;
  textPlacement?: TextPlacement;
  frameStyle?: FrameStyle;
  audioFile?: string;
  bgFile?: string;
  bgThumbnail?: string;
  bgUrl?: string;
  durationInSeconds: number;
  durationInFrames: number;
  infoBoard?: InfoBoardData;
}

export interface ScenarioData {
  title: string;
  aspectRatio: AspectRatio;
  cmType: CmType;
  tone: CmTone;
  visualTheme?: VisualTheme;
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
  quality: "economy" | "premium_video"; // 静止画かAI動画か
  tone: CmTone;
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
