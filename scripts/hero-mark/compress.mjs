/*
  Source for public/hero-mark.stl.gz — the hero's turning mark.

  The model is source/hero-mark.stl, the studio's own STL, kept exactly as
  they supplied it. This script only gzips it for the wire: Cloudflare does
  not compress model/stl on its own, and this file drops from 2.2 MB to about
  a seventh of that. HeroMark unzips it in the browser with the built-in
  DecompressionStream, so what three.js parses is the original file byte
  for byte. The script proves that before it writes anything.

  Run it whenever the STL in source/ is replaced. From the repo root:

      node scripts/hero-mark/compress.mjs
*/
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, "source/hero-mark.stl");
const OUT = path.join(here, "../../public/hero-mark.stl.gz");

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const stl = fs.readFileSync(SRC);
const gz = zlib.gzipSync(stl, { level: 9, memLevel: 9 });

if (sha(zlib.gunzipSync(gz)) !== sha(stl)) {
  throw new Error("gzip round trip changed the file; nothing written");
}
fs.writeFileSync(OUT, gz);

console.log(`${path.relative(process.cwd(), OUT)}: ${stl.length} → ${gz.length} bytes`);
console.log(`unzips to sha256 ${sha(stl)} (the source STL)`);
