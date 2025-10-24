import { execa } from "execa";
import { detectPackageManager, getNextPackages } from "../utils";
import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";

// Normalize unknown errors into readable strings for logging
const getErrorMsg = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Remove Next.js and PostCSS config files in the current working directory, if present
// Runs asynchronously and logs any failures but never throws
async function removeConfigFiles() {
  const cwd = process.cwd();
  try {
    const files = await readdir(cwd);
    await Promise.all(
      files
        .filter(f => f.startsWith("next.config.") || f.startsWith("postcss.config."))
        .map(async (file) => {
          const path = join(cwd, file);
          try {
            if ((await stat(path)).isFile()) {
              await unlink(path);
              console.log(`✔ Removed ${file}`);
            }
          } catch (error) {
            console.error(`Failed to remove ${file}: ${getErrorMsg(error)}`);
          }
        })
    );
  } catch (error) {
    console.error(`Failed to read directory: ${getErrorMsg(error)}`);
  }
}

// Handle dependency transitions and cleanup sequentially to avoid npm lock conflicts
export async function handleDependencies() {
  // Detect user's package manager and prepare shared execa options
  const pm = detectPackageManager();
  const cwd = process.cwd();
  const options = { cwd, stdio: "inherit" as const };

  // Step 1: Uninstall Next.js packages first (must complete before installs to avoid lock conflicts)
  await execa(pm, ["uninstall", "next", "@tailwindcss/postcss", ...getNextPackages()], { ...options, reject: false });

  // Step 2: Run installs and config cleanup in parallel (safe after uninstall completes)
  await Promise.all([
    execa(pm, ["install", "@tanstack/react-router", "@tanstack/react-start"], options),
    execa(pm, ["install", "-D", "vite", "@vitejs/plugin-react", "@tailwindcss/vite", "tailwindcss", "vite-tsconfig-paths"], options),
    removeConfigFiles(),
  ]);
}
