import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen Ad AI - LPテキストから動画広告を30秒で自動生成",
  description: "ランディングページのテキストを入力するだけで、Gemini AIが台本・音声・背景動画を企画し、HTMLテロップと合成した高品質広告動画を即座に作成できるWebスタジオ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

