import type { NextConfig } from "next";

const sandboxHost =
  process.env.NODE_ENV === "development" && process.env.V0_SANDBOX_URL
    ? new URL(process.env.V0_SANDBOX_URL).hostname
    : undefined;

const nextConfig: NextConfig = {
  // An empty adapter path suppresses the sandbox's missing injected adapter.
  adapterPath: "",
  allowedDevOrigins: sandboxHost ? [sandboxHost] : [],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
