import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next doesn't pick up stray
  // lockfiles from the home directory. `import.meta.dirname` rather than
  // `__dirname` because the package is ESM ("type": "module") for Vite.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
