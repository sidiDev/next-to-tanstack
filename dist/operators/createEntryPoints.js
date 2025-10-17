"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntryPoints = createEntryPoints;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Creates TanStack Start entry points (ssr.tsx and app.tsx)
 */
function createEntryPoints(useSrc) {
    console.log("📝 Creating TanStack Start entry points...");
    const srcDir = useSrc ? path_1.default.join(process.cwd(), "src") : process.cwd();
    const appDir = path_1.default.join(srcDir, "app");
    // Determine if project uses TypeScript
    const hasTypeScript = fs_1.default.existsSync(path_1.default.join(process.cwd(), "tsconfig.json"));
    const extension = hasTypeScript ? "tsx" : "jsx";
    // Create ssr entry point
    const ssrPath = path_1.default.join(srcDir, `ssr.${extension}`);
    if (!fs_1.default.existsSync(ssrPath)) {
        fs_1.default.writeFileSync(ssrPath, ssrEntryTemplate, "utf8");
        console.log(`✅ Created ${ssrPath}`);
    }
    else {
        console.log(`⏭️  ${ssrPath} already exists, skipping`);
    }
    // Create client entry point
    const clientPath = path_1.default.join(srcDir, `client.${extension}`);
    if (!fs_1.default.existsSync(clientPath)) {
        fs_1.default.writeFileSync(clientPath, clientEntryTemplate, "utf8");
        console.log(`✅ Created ${clientPath}`);
    }
    else {
        console.log(`⏭️  ${clientPath} already exists, skipping`);
    }
    // Create router configuration
    const routerPath = path_1.default.join(srcDir, `router.${extension.replace("x", "")}`);
    if (!fs_1.default.existsSync(routerPath)) {
        fs_1.default.writeFileSync(routerPath, routerTemplate, "utf8");
        console.log(`✅ Created ${routerPath}`);
    }
    else {
        console.log(`⏭️  ${routerPath} already exists, skipping`);
    }
    console.log("✅ Entry points created successfully!");
}
const ssrEntryTemplate = `/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getRouterManifest } from '@tanstack/react-start/router-manifest'

import { createRouter } from './router'

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler)
`;
const clientEntryTemplate = `/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router'

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)
`;
const routerTemplate = `import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
`;
//# sourceMappingURL=createEntryPoints.js.map