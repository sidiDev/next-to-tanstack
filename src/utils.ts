import { existsSync } from "fs";
import { join } from "path";

export function detectPackageManager(): "pnpm" | "yarn" | "npm" {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}
