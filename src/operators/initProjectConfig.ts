import fs from "fs";
import { join } from "path";

export async function initProjectConfig() {
  console.log("createViteConfig");

  fs.writeFileSync(join(process.cwd(), "vite.config.ts"), viteConfig);

  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  if (packageJson.scripts) {
    packageJson.type = "module";
    packageJson.scripts.dev = "vite dev";
    packageJson.scripts.build = "vite build";
    packageJson.scripts.start = "node .output/server/index.mjs";
  }

  // Write back with proper formatting
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );
}

const viteConfig = `
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    // Enables Vite to resolve imports using path aliases.
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      srcDirectory: 'src', // This is the default
      router: {
        // Specifies the directory TanStack Router uses for your routes.
        routesDirectory: 'app', // Defaults to "routes", relative to srcDirectory
      },
    }),
    viteReact(),
  ],
})
`;
