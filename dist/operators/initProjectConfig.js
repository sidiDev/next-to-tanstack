"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initProjectConfig = initProjectConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
function initProjectConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("createViteConfig");
        fs_1.default.writeFileSync((0, path_1.join)(process.cwd(), "vite.config.ts"), viteConfig);
        const packageJsonPath = (0, path_1.join)(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf8"));
        if (packageJson.scripts) {
            packageJson.type = "module";
            packageJson.scripts.dev = "vite dev";
            packageJson.scripts.build = "vite build";
            packageJson.scripts.start = "node .output/server/index.mjs";
        }
        // Write back with proper formatting
        fs_1.default.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");
    });
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
//# sourceMappingURL=initProjectConfig.js.map