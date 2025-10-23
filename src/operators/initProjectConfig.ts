import fs from "fs";
import { join } from "path";

export async function initProjectConfig(useSrc: boolean) {
  fs.writeFileSync(join(process.cwd(), "vite.config.ts"), viteConfig);

  const packageJsonPath = join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  if (packageJson.scripts) {
    packageJson.type = "module";
    packageJson.scripts.dev = "vite dev";
    packageJson.scripts.build = "vite build";
    packageJson.scripts.start = "node dist/server/server.js";
    packageJson.scripts.preview = "vite preview";
  }

  if (!useSrc) {
    fs.mkdirSync(join(process.cwd(), "src"), { recursive: true });
  }

  // Write back with proper formatting
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(join(process.cwd(), "tsconfig.json"), tsconfigJson, "utf8");
  fs.writeFileSync(
    join(process.cwd(), "src", "router.tsx"),
    routerConfig,
    "utf8"
  );

  const eslintConfigFiles = [
    "eslint.config.js",
    "eslint.config.mjs",
    "eslint.config.cjs",
  ];

  const eslintConfigPath = eslintConfigFiles
    .map((file) => join(process.cwd(), file))
    .find((filePath) => fs.existsSync(filePath));

  if (eslintConfigPath) {
    fs.writeFileSync(eslintConfigPath, eslintConfig, "utf8");
  }
}

const viteConfig = `// vite.config.ts
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
    tsconfigPaths(),
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

const tsconfigJson = `{
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,

    /* Linting */
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
`;

const routerConfig = `import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}
`;

const eslintConfig = `export default [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "build/**",
      ".turbo/**",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
`;
