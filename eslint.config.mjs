import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output. Listing these back explicitly matters: naming any ignore
    // replaces the defaults wholesale, so without them `npm run lint` walked
    // the vinext/Cloudflare bundles in dist/ and reported ~15k problems from
    // generated code, burying the handful in src/.
    "dist/**",
    ".vinext/**",
    ".wrangler/**",
    // Scratch git worktrees checked out inside the repo — copies of the
    // project, so every file in them would be reported twice.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
