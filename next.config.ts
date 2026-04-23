import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  serverExternalPackages: ["node-cron", "imapflow", "mailparser", "nodemailer", "puppeteer"],
};

export default nextConfig;
