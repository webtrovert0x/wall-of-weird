import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.externals.push(
      "pino-pretty",
      "lokijs",
      "encoding",
      "@x402/evm",
      "@x402/evm/upto/client",
      "@x402/evm/exact/client",
      "@x402/core/client",
      "@x402/svm/exact/client"
    );
    return config;
  },
};

export default nextConfig;
