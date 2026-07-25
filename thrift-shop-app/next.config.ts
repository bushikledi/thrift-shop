import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // The Next image optimizer runs inside the app container and can't reach
    // the MinIO object store at the browser-facing http://localhost:9000 URL
    // (there, "localhost" is the app container itself), so optimizing uploaded
    // images 400s. Serve images unoptimized in this self-hosted/dev setup so
    // the browser loads them directly.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
