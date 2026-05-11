import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ExcelJS and mongoose use Node.js APIs — keep server-side only
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
