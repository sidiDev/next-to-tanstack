import { existsSync, rmSync } from "fs";
import { join } from "path";

const LEGACY_FOLDERS = [".next", ".turbo", "next-env.d.ts"];

export function cleanupLegacyArtifacts() {
  const cwd = process.cwd();

  LEGACY_FOLDERS.forEach((folder) => {
    const target = join(cwd, folder);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
      console.log(`✔ Removed legacy ${folder} directory`);
    }
  });
}
