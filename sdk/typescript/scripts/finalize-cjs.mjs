import { accessSync, writeFileSync } from "node:fs";

// The package root is ESM. Mark the declared require export's subtree as
// CommonJS so Node executes tsc's emitted exports/require statements correctly.
accessSync(new URL("../dist/cjs/index.js", import.meta.url));
writeFileSync(
  new URL("../dist/cjs/package.json", import.meta.url),
  JSON.stringify({ type: "commonjs" }) + "\n",
);
