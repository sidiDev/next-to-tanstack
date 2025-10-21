import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { execa } from "execa";
import { detectPackageManager } from "../utils";

const CONFIG_FILES = [
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "next.config.cjs",
  "postcss.config.js",
  "postcss.config.ts",
  "postcss.config.mjs",
  "postcss.config.cjs",
];

type PackageManager = "npm" | "yarn" | "pnpm";

const PACKAGE_MANAGER_COMMANDS: Record<
  PackageManager,
  {
    add: (packages: string[]) => string[];
    addDev: (packages: string[]) => string[];
    remove: (packages: string[]) => string[];
  }
> = {
  npm: {
    add: (packages) => ["install", ...packages],
    addDev: (packages) => ["install", "-D", ...packages],
    remove: (packages) => ["uninstall", ...packages],
  },
  yarn: {
    add: (packages) => ["add", ...packages],
    addDev: (packages) => ["add", "-D", ...packages],
    remove: (packages) => ["remove", ...packages],
  },
  pnpm: {
    add: (packages) => ["add", ...packages],
    addDev: (packages) => ["add", "-D", ...packages],
    remove: (packages) => ["remove", ...packages],
  },
};

function removeLegacyConfigFiles(cwd: string) {
  CONFIG_FILES.forEach((file) => {
    const filePath = join(cwd, file);
    if (existsSync(filePath)) {
      rmSync(filePath, { force: true });
    }
  });
}

function collectInstalledPackages(cwd: string): Set<string> {
  const packageJsonPath = join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    return new Set();
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    return new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
      ...Object.keys(packageJson.optionalDependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
    ]);
  } catch (error) {
    console.warn(
      "Warning: Unable to parse package.json, skipping safe uninstall safeguards",
      error
    );
    return new Set();
  }
}

export async function handleDependencies() {
  const pm = detectPackageManager();
  const pmCommands = PACKAGE_MANAGER_COMMANDS[pm];
  const cwd = process.cwd();

  console.log("🧹 Cleaning up Next.js configuration files...");
  removeLegacyConfigFiles(cwd);
  console.log("✔ Configuration files cleaned");

  const installedPackages = collectInstalledPackages(cwd);
  const uninstallTargets = ["next", "@tailwindcss/postcss"].filter((pkg) =>
    installedPackages.has(pkg)
  );

  if (uninstallTargets.length) {
    console.log("📦 Uninstalling Next.js dependencies...");
    await execa(pm, pmCommands.remove(uninstallTargets), {
      cwd,
      stdio: "inherit",
    });
    console.log("✔ Next.js dependencies removed");
  }

  console.log("📦 Installing TanStack packages...");
  await execa(
    pm,
    pmCommands.add(["@tanstack/react-router", "@tanstack/react-start"]),
    {
      cwd,
      stdio: "inherit",
    }
  );
  console.log("✔ TanStack packages installed");

  console.log("📦 Installing Vite and build tools...");
  await execa(
    pm,
    pmCommands.addDev([
      "vite",
      "@vitejs/plugin-react",
      "@tailwindcss/vite",
      "tailwindcss",
      "vite-tsconfig-paths",
    ]),
    {
      cwd,
      stdio: "inherit",
    }
  );
  console.log("✔ Vite and build tools installed");
}
