"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateRoutes = migrateRoutes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Migrates all routes from Next.js App Router to TanStack Start
 * Handles nested routes, dynamic routes, and catch-all routes
 */
function migrateRoutes(useSrc) {
    console.log("🚀 Starting route migration...");
    const appDir = useSrc
        ? path_1.default.join(process.cwd(), "src", "app")
        : path_1.default.join(process.cwd(), "app");
    if (!fs_1.default.existsSync(appDir)) {
        console.error("❌ App directory not found");
        return;
    }
    const routeFiles = discoverRouteFiles(appDir, appDir);
    console.log(`📁 Found ${routeFiles.length} route files to migrate`);
    for (const routeFile of routeFiles) {
        try {
            migrateRouteFile(routeFile);
        }
        catch (error) {
            console.error(`❌ Error migrating ${routeFile.originalPath}:`, error);
        }
    }
    console.log("✅ Route migration completed!");
}
/**
 * Recursively discover all route files in the app directory
 */
function discoverRouteFiles(dir, baseDir, routeFiles = []) {
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip special Next.js directories that aren't routes
            if (!entry.name.startsWith("_") && !entry.name.startsWith(".")) {
                discoverRouteFiles(fullPath, baseDir, routeFiles);
            }
        }
        else if (entry.isFile()) {
            const routeFile = analyzeRouteFile(fullPath, baseDir);
            if (routeFile) {
                routeFiles.push(routeFile);
            }
        }
    }
    return routeFiles;
}
/**
 * Analyze a file to determine if it's a route file and its type
 */
function analyzeRouteFile(filePath, baseDir) {
    const fileName = path_1.default.basename(filePath);
    const relativePath = path_1.default.relative(baseDir, filePath);
    const dirPath = path_1.default.dirname(relativePath);
    // Match route files: page.tsx, layout.tsx, loading.tsx, error.tsx, route.ts
    const pageRegex = /^page\.(tsx?|jsx?)$/;
    const layoutRegex = /^layout\.(tsx?|jsx?)$/;
    const loadingRegex = /^loading\.(tsx?|jsx?)$/;
    const errorRegex = /^error\.(tsx?|jsx?)$/;
    const notFoundRegex = /^not-found\.(tsx?|jsx?)$/;
    const apiRegex = /^route\.(tsx?|jsx?)$/;
    let type = null;
    if (pageRegex.test(fileName))
        type = "page";
    else if (layoutRegex.test(fileName))
        type = "layout";
    else if (loadingRegex.test(fileName))
        type = "loading";
    else if (errorRegex.test(fileName))
        type = "error";
    else if (notFoundRegex.test(fileName))
        type = "not-found";
    else if (apiRegex.test(fileName))
        type = "api";
    if (!type)
        return null;
    const extension = fileName.split(".").pop() || "tsx";
    const isTypeScript = extension === "tsx" || extension === "ts";
    // Check if the route is dynamic or catch-all
    const isDynamic = /\[[\w-]+\]/.test(dirPath);
    const isCatchAll = /\[\.{3}[\w-]+\]/.test(dirPath);
    // Generate new path according to TanStack Router conventions
    const newPath = generateTanStackPath(filePath, baseDir, type);
    return {
        originalPath: filePath,
        newPath,
        type,
        isTypeScript,
        isDynamic,
        isCatchAll,
    };
}
/**
 * Generate the TanStack Router path from Next.js path
 * Examples:
 * - app/page.tsx -> app/index.tsx
 * - app/about/page.tsx -> app/about.tsx (or app/about/index.tsx for nested layouts)
 * - app/blog/[slug]/page.tsx -> app/blog.$slug.tsx
 * - app/docs/[...slug]/page.tsx -> app/docs.$.tsx
 */
function generateTanStackPath(filePath, baseDir, type) {
    const relativePath = path_1.default.relative(baseDir, filePath);
    const dirPath = path_1.default.dirname(relativePath);
    const fileName = path_1.default.basename(filePath);
    const extension = fileName.split(".").pop();
    // Root route is special
    if (dirPath === "." && type === "page") {
        return path_1.default.join(baseDir, `index.${extension}`);
    }
    // Convert Next.js dynamic segments to TanStack Router format
    let routePath = dirPath.replace(/\\/g, "/"); // Normalize path separators
    // Replace [param] with $param
    routePath = routePath.replace(/\[([^\]]+)\]/g, (match, param) => {
        // Catch-all routes: [...slug] -> $
        if (param.startsWith("...")) {
            return "$";
        }
        // Optional catch-all: [[...slug]] -> $ (TanStack handles optional params differently)
        if (param.startsWith("[...") && param.endsWith("]")) {
            return "$";
        }
        // Dynamic params: [slug] -> $slug
        return `$${param}`;
    });
    // Convert path segments to file name
    // blog/post -> blog.post
    // For pages, we can use the flat file structure
    if (type === "page") {
        const segments = routePath.split("/").filter((s) => s !== ".");
        if (segments.length === 0) {
            return path_1.default.join(baseDir, `index.${extension}`);
        }
        const fileName = segments.join(".") + `.${extension}`;
        return path_1.default.join(baseDir, fileName);
    }
    // For layouts, errors, and loading, keep directory structure
    return path_1.default.join(baseDir, routePath, `_${type}.${extension}`);
}
/**
 * Migrate a single route file
 */
function migrateRouteFile(routeFile) {
    const content = fs_1.default.readFileSync(routeFile.originalPath, "utf8");
    let transformedContent;
    switch (routeFile.type) {
        case "page":
            transformedContent = transformPageComponent(content, routeFile.isTypeScript, getRoutePath(routeFile));
            break;
        case "layout":
            transformedContent = transformLayoutComponent(content, routeFile.isTypeScript, getRoutePath(routeFile));
            break;
        case "loading":
            transformedContent = transformLoadingComponent(content, routeFile.isTypeScript, getRoutePath(routeFile));
            break;
        case "error":
            transformedContent = transformErrorComponent(content, routeFile.isTypeScript, getRoutePath(routeFile));
            break;
        case "api":
            transformedContent = transformApiRoute(content, routeFile.isTypeScript, getRoutePath(routeFile));
            break;
        default:
            console.warn(`⚠️  Unsupported route type: ${routeFile.type}`);
            return;
    }
    // Ensure directory exists
    const newDir = path_1.default.dirname(routeFile.newPath);
    if (!fs_1.default.existsSync(newDir)) {
        fs_1.default.mkdirSync(newDir, { recursive: true });
    }
    // Write the transformed file
    fs_1.default.writeFileSync(routeFile.newPath, transformedContent, "utf8");
    console.log(`✅ Migrated: ${routeFile.originalPath} -> ${routeFile.newPath}`);
    // Backup original file
    const backupPath = routeFile.originalPath + ".backup";
    fs_1.default.renameSync(routeFile.originalPath, backupPath);
}
/**
 * Get the route path from the file structure
 */
function getRoutePath(routeFile) {
    const baseDir = routeFile.originalPath.includes("/src/app")
        ? path_1.default.join(process.cwd(), "src", "app")
        : path_1.default.join(process.cwd(), "app");
    const relativePath = path_1.default.relative(baseDir, routeFile.originalPath);
    const dirPath = path_1.default.dirname(relativePath);
    if (dirPath === ".")
        return "/";
    // Convert to route path
    let routePath = "/" + dirPath.replace(/\\/g, "/");
    // Convert dynamic segments
    routePath = routePath.replace(/\[([^\]]+)\]/g, (match, param) => {
        if (param.startsWith("...")) {
            return "$";
        }
        return `$${param}`;
    });
    return routePath;
}
/**
 * Transform a page component
 */
function transformPageComponent(content, isTypeScript, routePath) {
    // Remove 'use client' directive
    let transformed = content.replace(/^['"]use client['"];?\s*\n/m, "");
    // Add TanStack imports
    const imports = ["import { createFileRoute } from '@tanstack/react-router'"];
    // Check if it's an async component (data fetching in component)
    const hasAsyncComponent = /export\s+default\s+async\s+function/.test(content);
    // Extract component name
    const componentMatch = content.match(/export\s+default\s+(?:async\s+)?function\s+(\w+)/);
    const componentName = (componentMatch === null || componentMatch === void 0 ? void 0 : componentMatch[1]) || "Component";
    // Remove export default
    transformed = transformed.replace(/export\s+default\s+(?:async\s+)?function\s+(\w+)/, `function $1`);
    // If async component, convert to loader
    if (hasAsyncComponent) {
        transformed = convertAsyncComponentToLoader(transformed, componentName, isTypeScript);
    }
    // Replace Next.js specific imports
    transformed = replaceNextJsImports(transformed);
    // Add route definition
    const routeDefinition = `
export const Route = createFileRoute('${routePath}')({
  component: ${componentName},${hasAsyncComponent ? "\n  // TODO: Move data fetching logic to loader" : ""}
})
`;
    return imports.join("\n") + "\n\n" + transformed + "\n" + routeDefinition;
}
/**
 * Transform a layout component
 */
function transformLayoutComponent(content, isTypeScript, routePath) {
    let transformed = content;
    // Add TanStack imports
    const imports = [
        "import { createFileRoute, Outlet } from '@tanstack/react-router'",
    ];
    // Extract component
    const componentMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const componentName = (componentMatch === null || componentMatch === void 0 ? void 0 : componentMatch[1]) || "Layout";
    // Remove export default
    transformed = transformed.replace(/export\s+default\s+function\s+(\w+)/, "function $1");
    // Replace {children} with <Outlet />
    transformed = transformed.replace(/\{children\}/g, "<Outlet />");
    // Replace Next.js specific imports
    transformed = replaceNextJsImports(transformed);
    // Add route definition
    const routeDefinition = `
export const Route = createFileRoute('${routePath}')({
  component: ${componentName},
})
`;
    return imports.join("\n") + "\n\n" + transformed + "\n" + routeDefinition;
}
/**
 * Transform a loading component
 */
function transformLoadingComponent(content, isTypeScript, routePath) {
    let transformed = content;
    const imports = ["import { createFileRoute } from '@tanstack/react-router'"];
    const componentMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const componentName = (componentMatch === null || componentMatch === void 0 ? void 0 : componentMatch[1]) || "LoadingComponent";
    transformed = transformed.replace(/export\s+default\s+function\s+(\w+)/, "function $1");
    transformed = replaceNextJsImports(transformed);
    const routeDefinition = `
export const Route = createFileRoute('${routePath}')({
  pendingComponent: ${componentName},
})
`;
    return imports.join("\n") + "\n\n" + transformed + "\n" + routeDefinition;
}
/**
 * Transform an error component
 */
function transformErrorComponent(content, isTypeScript, routePath) {
    let transformed = content.replace(/^['"]use client['"];?\s*\n/m, "");
    const imports = [
        "import { createFileRoute, ErrorComponent } from '@tanstack/react-router'",
    ];
    const componentMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const componentName = (componentMatch === null || componentMatch === void 0 ? void 0 : componentMatch[1]) || "ErrorBoundary";
    transformed = transformed.replace(/export\s+default\s+function\s+(\w+)/, "function $1");
    transformed = replaceNextJsImports(transformed);
    const routeDefinition = `
export const Route = createFileRoute('${routePath}')({
  errorComponent: ${componentName},
})
`;
    return imports.join("\n") + "\n\n" + transformed + "\n" + routeDefinition;
}
/**
 * Transform an API route
 */
function transformApiRoute(content, isTypeScript, routePath) {
    let transformed = content;
    const imports = ["import { createFileRoute } from '@tanstack/react-router'"];
    // Extract HTTP methods
    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    const handlers = [];
    for (const method of methods) {
        const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, "g");
        const match = content.match(methodRegex);
        if (match) {
            handlers.push(`${method}: ${match[0].replace("export async function", "async")}`);
        }
    }
    const routeDefinition = `
export const Route = createFileRoute('${routePath}')({
  server: {
    handlers: {
      ${handlers.join(",\n      ")}
    }
  }
})
`;
    return imports.join("\n") + "\n\n" + routeDefinition;
}
/**
 * Convert async component with data fetching to use loader
 */
function convertAsyncComponentToLoader(content, componentName, isTypeScript) {
    // This is a simplified version - in production, you'd want more sophisticated parsing
    // Extract fetch calls and move to loader
    console.warn(`⚠️  Async component detected in ${componentName}. Please manually move data fetching to loader.`);
    return content.replace(/async\s+function/, "function");
}
/**
 * Replace Next.js specific imports with TanStack equivalents
 */
function replaceNextJsImports(content) {
    let transformed = content;
    // Replace next/link with @tanstack/react-router Link
    transformed = transformed.replace(/import\s+Link\s+from\s+['"]next\/link['"]/g, "import { Link } from '@tanstack/react-router'");
    // Replace href with to in Link components
    transformed = transformed.replace(/<Link\s+href=/g, "<Link to=");
    // Replace next/navigation hooks
    transformed = transformed.replace(/import\s+\{([^}]+)\}\s+from\s+['"]next\/navigation['"]/g, (match, imports) => {
        const importList = imports.split(",").map((i) => i.trim());
        const tanstackImports = importList
            .map((imp) => {
            if (imp === "useRouter")
                return "useNavigate";
            if (imp === "usePathname")
                return "useLocation";
            if (imp === "useSearchParams")
                return "useSearch";
            return imp;
        })
            .join(", ");
        return `import { ${tanstackImports} } from '@tanstack/react-router'`;
    });
    // Replace useRouter() with useNavigate()
    transformed = transformed.replace(/useRouter\(\)/g, "useNavigate()");
    transformed = transformed.replace(/router\.push\(/g, "navigate(");
    transformed = transformed.replace(/router\.replace\(/g, "navigate(");
    // Replace usePathname() with useLocation().pathname
    transformed = transformed.replace(/usePathname\(\)/g, "useLocation().pathname");
    // Add comment for next/image
    if (transformed.includes("next/image")) {
        transformed =
            "// TODO: Replace next/image with @unpic/react Image component\n" +
                transformed;
    }
    return transformed;
}
//# sourceMappingURL=migrateRoutes.js.map