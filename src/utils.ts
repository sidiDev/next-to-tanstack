import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function detectPackageManager(): "pnpm" | "yarn" | "npm" {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export function getNextPackages(): string[] {
  const cwd = process.cwd();
  const packageJson = JSON.parse(
    readFileSync(join(cwd, "package.json"), "utf8")
  );
  return Object.keys(packageJson.dependencies).filter(
    (dep) => dep.startsWith("@next") || dep.includes("eslint-config-next")
  );
}
