import { execa } from "execa";
import { detectPackageManager, getNextPackages } from "../utils";

export async function handleDependencies() {
  const pm = detectPackageManager();
  const nextPackages = getNextPackages();

  await Promise.all([
    await execa(
      pm,
      ["uninstall", "next", "@tailwindcss/postcss", ...nextPackages],
      {
        cwd: process.cwd(),
        stdio: "inherit",
        reject: false,
      }
    ),
    await execa("rm", ["next.config.*", "postcss.config.*"], {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: true,
    }),
    await execa(
      pm,
      ["install", "@tanstack/react-router", "@tanstack/react-start"],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      }
    ),

    await execa(
      pm,
      [
        "install",
        "-D",
        "vite",
        "@vitejs/plugin-react",
        "@tailwindcss/vite",
        "tailwindcss",
        "vite-tsconfig-paths",
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      }
    ),
  ]);
}
