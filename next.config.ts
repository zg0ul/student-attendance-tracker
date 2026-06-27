import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — stray lockfiles in parent dirs mislead detection.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
