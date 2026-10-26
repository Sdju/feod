import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  typedRoutes: true,
  sassOptions: { implementation: "sass-embedded" },
};

export default nextConfig;
