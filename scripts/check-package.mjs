import { execFileSync } from "node:child_process"
import { copyFile, cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)))
const { name, files } = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
const consumer = await realpath(await mkdtemp(join(root, ".check-package-")))
if (dirname(consumer) !== root) throw new Error("Package check directory must be inside the repository")

try {
  await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "package-consumer", private: true }))
  const installed = join(consumer, "node_modules", name)
  for (const file of ["package.json", ...files]) {
    const target = join(installed, file)
    await mkdir(dirname(target), { recursive: true })
    await cp(join(root, file), target, { recursive: true })
  }
  await copyFile(new URL("./fixtures/package-consumer.mts", import.meta.url), join(consumer, "consumer.mts"))

  const options = { cwd: consumer, stdio: "inherit" }
  const tsc = join(root, "node_modules", "typescript", "bin", "tsc")
  execFileSync(process.execPath, [tsc, "--module", "NodeNext", "--strict", "consumer.mts"], options)
  execFileSync(process.execPath, ["consumer.mjs"], options)
  console.log("Package check passed: the consumer can compile and run the validators.")
} finally {
  await rm(consumer, { recursive: true })
}
