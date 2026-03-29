import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Clock routes like /6/ resolve consistently */
  trailingSlash: true,
};

export default nextConfig;
