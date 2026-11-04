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
}
