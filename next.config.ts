import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  output: "export", // 讓 Next.js 生成靜態 HTML
  distDir: "out", // 指定輸出目錄為 out
};

export default nextConfig;
