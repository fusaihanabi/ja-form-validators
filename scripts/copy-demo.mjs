import { copyFile } from "node:fs/promises"

await Promise.all([
  copyFile(new URL("../dist/index.js", import.meta.url), new URL("../docs/validators.js", import.meta.url)),
  copyFile(
    new URL("../dist/landline-metadata.js", import.meta.url),
    new URL("../docs/landline-metadata.js", import.meta.url),
  ),
])
