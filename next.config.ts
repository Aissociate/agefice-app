import type { NextConfig } from "next";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  serverExternalPackages: ["node-cron", "imapflow", "mailparser", "nodemailer", "puppeteer"],
  ...(allowedDevOrigins.length > 0 && { allowedDevOrigins }),
};

export default nextConfig;
