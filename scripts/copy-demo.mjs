import { copyFile } from "node:fs/promises"

await copyFile(
  new URL("../dist/index.js", import.meta.url),
  new URL("../docs/validators.js", import.meta.url),
)
