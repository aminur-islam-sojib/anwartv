import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co", // ImgBB's primary direct image hosting domain
        port: "",
        pathname: "/**", // Allows any path under i.ibb.co
      },
      {
        protocol: "https",
        hostname: "*.ibb.co", // Catch-all wildcard for any other alternate subdomains ImgBB uses
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
