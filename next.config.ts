import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Headshots are ESPN CDN URLs from the espn_nba_* release files (R-BN-5: no assets committed).
    remotePatterns: [new URL("https://a.espncdn.com/i/headshots/nba/players/full/**")],
  },
};

export default nextConfig;
