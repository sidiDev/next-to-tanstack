"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAdvancedFeatures = handleAdvancedFeatures;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Handles migration of advanced Next.js features like:
 * - next/font
 * - next/image
 * - Environment variables
 * - Middleware
 */
function handleAdvancedFeatures(useSrc) {
    console.log("🔧 Handling advanced Next.js features...");
    const rootDir = process.cwd();
    const srcDir = useSrc ? path_1.default.join(rootDir, "src") : rootDir;
    const appDir = path_1.default.join(srcDir, "app");
    // Handle fonts migration
    handleFontMigration(appDir);
    // Handle environment variables
    handleEnvVars(rootDir);
    // Handle middleware
    handleMiddleware(srcDir);
    // Create migration guide
    createMigrationGuide(rootDir);
    console.log("✅ Advanced features handled!");
}
/**
 * Handle next/font migration to Fontsource
 */
function handleFontMigration(appDir) {
    console.log("🔤 Analyzing font usage...");
    const files = getAllFiles(appDir);
    const fontImports = [];
    for (const file of files) {
        const content = fs_1.default.readFileSync(file, "utf8");
        // Check for next/font/google imports
        const googleFontMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]next\/font\/google['"]/g);
        if (googleFontMatch) {
            googleFontMatch.forEach((match) => {
                const fontsMatch = match.match(/\{([^}]+)\}/);
                if (fontsMatch) {
                    const fonts = fontsMatch[1].split(",").map((f) => f.trim());
                    fontImports.push(...fonts);
                }
            });
        }
        // Check for next/font/local imports
        if (content.includes("next/font/local")) {
            console.warn("⚠️  Local fonts detected - manual migration required");
        }
    }
    if (fontImports.length > 0) {
        console.log(`📝 Found ${fontImports.length} font imports to migrate`);
        // Create font migration instructions
        const fontMigrationInstructions = generateFontInstructions(fontImports);
        const instructionsPath = path_1.default.join(process.cwd(), "FONT_MIGRATION.md");
        fs_1.default.writeFileSync(instructionsPath, fontMigrationInstructions, "utf8");
        console.log(`✅ Created font migration guide at ${instructionsPath}`);
    }
}
/**
 * Generate font migration instructions
 */
function generateFontInstructions(fonts) {
    const uniqueFonts = [...new Set(fonts)];
    return `# Font Migration Guide

Next.js fonts need to be replaced with Fontsource or CSS-based fonts.

## Detected Fonts

${uniqueFonts.map((font) => `- ${font}`).join("\n")}

## Migration Steps

### Option 1: Using Fontsource (Recommended)

1. Install the required fonts:

\`\`\`bash
npm install -D ${uniqueFonts
        .map((font) => `@fontsource-variable/${font.toLowerCase().replace(/_/g, "-")}`)
        .join(" ")}
\`\`\`

2. Import in your \`app.css\`:

\`\`\`css
${uniqueFonts
        .map((font) => `@import '@fontsource-variable/${font.toLowerCase().replace(/_/g, "-")}';`)
        .join("\n")}
\`\`\`

3. Update your Tailwind config or CSS to use the fonts:

\`\`\`css
@theme inline {
${uniqueFonts
        .map((font, i) => `  --font-${i === 0 ? "sans" : font.toLowerCase()}: '${font.replace(/_/g, " ")} Variable', ${i === 0 ? "sans-serif" : "serif"};`)
        .join("\n")}
}
\`\`\`

### Option 2: Using Google Fonts CDN

Add to your \`__root.tsx\` in the head section:

\`\`\`tsx
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?${uniqueFonts
        .map((font) => `family=${font.replace(/_/g, "+")}:wght@400;500;600;700`)
        .join("&")}&display=swap"
/>
\`\`\`

## Updating Component Code

Replace font className usage:

\`\`\`tsx
// Before (Next.js)
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
<body className={inter.className}>

// After (TanStack Start)
// Fonts are now applied globally through CSS
<body className="font-sans">
\`\`\`
`;
}
/**
 * Handle environment variables migration
 */
function handleEnvVars(rootDir) {
    const envLocal = path_1.default.join(rootDir, ".env.local");
    const envExample = path_1.default.join(rootDir, ".env.example");
    if (fs_1.default.existsSync(envLocal)) {
        console.log("📝 Analyzing environment variables...");
        const envContent = fs_1.default.readFileSync(envLocal, "utf8");
        // Check for NEXT_PUBLIC_ variables
        const publicVars = envContent.match(/NEXT_PUBLIC_[\w_]+=.*/g);
        if (publicVars && publicVars.length > 0) {
            console.warn("⚠️  Found NEXT_PUBLIC_ environment variables");
            // Create migration guide for env vars
            const envGuide = `# Environment Variables Migration

TanStack Start handles environment variables differently from Next.js.

## Next.js Environment Variables Found:

${publicVars.map((v) => `- ${v.split("=")[0]}`).join("\n")}

## Migration Steps:

1. **Client-side variables**: In TanStack Start, prefix with \`VITE_\` instead of \`NEXT_PUBLIC_\`

   Before: \`NEXT_PUBLIC_API_URL=...\`
   After: \`VITE_API_URL=...\`

2. **Server-side variables**: No prefix needed, just use the variable name

3. **Access in code**:

   \`\`\`tsx
   // Client-side
   const apiUrl = import.meta.env.VITE_API_URL
   
   // Server-side (in loaders, server functions)
   const secretKey = process.env.SECRET_KEY
   \`\`\`

4. **Update your .env files** with the new naming convention

5. **Type safety**: Create \`env.d.ts\`:

   \`\`\`typescript
   /// <reference types="vite/client" />
   
   interface ImportMetaEnv {
     readonly VITE_API_URL: string
     // Add other VITE_ variables here
   }
   
   interface ImportMeta {
     readonly env: ImportMetaEnv
   }
   \`\`\`
`;
            const envGuidePath = path_1.default.join(rootDir, "ENV_MIGRATION.md");
            fs_1.default.writeFileSync(envGuidePath, envGuide, "utf8");
            console.log(`✅ Created environment variables guide at ${envGuidePath}`);
        }
    }
}
/**
 * Handle middleware migration
 */
function handleMiddleware(srcDir) {
    const middlewarePath = path_1.default.join(srcDir, "middleware.ts");
    const middlewareJsPath = path_1.default.join(srcDir, "middleware.js");
    const middlewareFile = fs_1.default.existsSync(middlewarePath)
        ? middlewarePath
        : fs_1.default.existsSync(middlewareJsPath)
            ? middlewareJsPath
            : null;
    if (middlewareFile) {
        console.warn("⚠️  Next.js middleware detected");
        const middlewareGuide = `# Middleware Migration Guide

Next.js middleware needs to be converted to TanStack Start middleware.

## Migration Steps:

1. **TanStack Start uses route-based middleware** instead of global middleware

2. **Convert to beforeLoad**:

   \`\`\`tsx
   // In your route file (e.g., app/__root.tsx or specific route)
   export const Route = createRootRoute({
     beforeLoad: async ({ location }) => {
       // Your middleware logic here
       // Example: Authentication check
       const isAuthenticated = await checkAuth()
       
       if (!isAuthenticated && location.pathname !== '/login') {
         throw redirect({ to: '/login' })
       }
     },
     component: RootComponent,
   })
   \`\`\`

3. **For API routes**, use server handlers:

   \`\`\`tsx
   export const Route = createFileRoute('/api/protected')({
     server: {
       handlers: {
         GET: async ({ request }) => {
           // Middleware-like logic
           const auth = request.headers.get('authorization')
           if (!auth) {
             return new Response('Unauthorized', { status: 401 })
           }
           
           // Your handler logic
           return Response.json({ data: 'protected' })
         }
       }
     }
   })
   \`\`\`

4. **Pattern matching**: Use route groups and layouts for path-based middleware

   - Create a layout for protected routes
   - Add beforeLoad to that layout
   - Nest protected routes under that layout

## Your Original Middleware

Review your original middleware at: ${middlewareFile}

And adapt the logic to the patterns above.
`;
        const middlewareGuidePath = path_1.default.join(process.cwd(), "MIDDLEWARE_MIGRATION.md");
        fs_1.default.writeFileSync(middlewareGuidePath, middlewareGuide, "utf8");
        console.log(`✅ Created middleware migration guide at ${middlewareGuidePath}`);
        // Backup original middleware
        const backupPath = middlewareFile + ".backup";
        fs_1.default.copyFileSync(middlewareFile, backupPath);
        console.log(`📦 Backed up middleware to ${backupPath}`);
    }
}
/**
 * Create comprehensive migration guide
 */
function createMigrationGuide(rootDir) {
    const guide = `# Next.js to TanStack Start Migration Guide

This guide covers additional migration steps and important differences.

## 🔄 Quick Reference

### Imports

| Next.js | TanStack Start |
|---------|---------------|
| \`import Link from 'next/link'\` | \`import { Link } from '@tanstack/react-router'\` |
| \`import { useRouter } from 'next/navigation'\` | \`import { useNavigate } from '@tanstack/react-router'\` |
| \`import { usePathname } from 'next/navigation'\` | \`import { useLocation } from '@tanstack/react-router'\` |
| \`import { useSearchParams } from 'next/navigation'\` | \`import { useSearch } from '@tanstack/react-router'\` |
| \`import Image from 'next/image'\` | \`import { Image } from '@unpic/react'\` |

### Props

| Next.js | TanStack Start |
|---------|---------------|
| \`<Link href="/about">\` | \`<Link to="/about">\` |
| \`router.push('/path')\` | \`navigate({ to: '/path' })\` |
| \`router.replace('/path')\` | \`navigate({ to: '/path', replace: true })\` |

## 📁 File Structure

### Route Files

- \`page.tsx\` → \`index.tsx\` or \`route-name.tsx\`
- \`layout.tsx\` → \`_layout.tsx\` or use \`__root.tsx\`
- \`loading.tsx\` → Use \`pendingComponent\` in route config
- \`error.tsx\` → Use \`errorComponent\` in route config
- \`route.ts\` (API) → Server handlers in route config

### Dynamic Routes

- \`[slug]/page.tsx\` → \`$slug.tsx\`
- \`[...slug]/page.tsx\` → \`$.tsx\` (catch-all)

## 🎨 Styling

### Global Styles

- \`globals.css\` → \`app.css\`
- Import in \`__root.tsx\` via \`head\` config

### Tailwind CSS

Update your PostCSS config is no longer needed. Vite handles Tailwind via \`@tailwindcss/vite\` plugin.

## 🔐 Authentication

Use \`beforeLoad\` for authentication:

\`\`\`tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return { user }
  },
  component: Dashboard,
})
\`\`\`

## 📦 Data Fetching

### Server Components → Loaders

\`\`\`tsx
// Before (Next.js Server Component)
export default async function Page() {
  const data = await fetch('...')
  const json = await data.json()
  return <div>{json.title}</div>
}

// After (TanStack Start)
export const Route = createFileRoute('/page')({
  loader: async () => {
    const data = await fetch('...')
    return data.json()
  },
  component: Page,
})

function Page() {
  const data = Route.useLoaderData()
  return <div>{data.title}</div>
}
\`\`\`

## 🚀 Server Functions

### Server Actions → Server Functions

\`\`\`tsx
// Before (Next.js)
'use server'
export async function createPost(formData: FormData) {
  // ...
}

// After (TanStack Start)
import { createServerFn } from '@tanstack/react-start'

export const createPost = createServerFn()
  .validator((data: FormData) => data)
  .handler(async (formData) => {
    // ...
  })
\`\`\`

## 🖼️ Images

Install \`@unpic/react\` for optimized images:

\`\`\`bash
npm install @unpic/react
\`\`\`

\`\`\`tsx
import { Image } from '@unpic/react'

<Image
  src="/image.jpg"
  alt="Description"
  width={600}
  height={400}
  layout="constrained"
/>
\`\`\`

## 🔧 Configuration

### next.config.js → vite.config.ts

Most Next.js config options have Vite equivalents:

- \`redirects\` → Use TanStack Router's navigation
- \`rewrites\` → Use TanStack Router's path aliases
- \`headers\` → Configure in server handlers
- \`env\` → Use \`.env\` files (Vite loads them automatically)

## 📝 Metadata

### Static Metadata

\`\`\`tsx
// Add to route config's head function
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
      { name: 'description', content: 'App description' },
    ],
  }),
})
\`\`\`

### Dynamic Metadata

Use the \`Meta\` component from \`@tanstack/react-start\`

## 🧪 Testing

Update imports in tests from Next.js to TanStack Router equivalents.

## 📚 Additional Resources

- [TanStack Start Documentation](https://tanstack.com/start)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Migration Examples](https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js)

## ⚠️ Known Limitations

1. **Incremental Static Regeneration (ISR)**: Not directly supported. Use static prerendering or SSR.
2. **Image Optimization**: Use \`@unpic/react\` or a CDN solution.
3. **Internationalization**: Implement using TanStack Router's path-based routing.
4. **Edge Runtime**: TanStack Start uses Node.js runtime by default.

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found"**: Check import paths and update Next.js imports
2. **"createFileRoute is not defined"**: Add import from '@tanstack/react-router'
3. **Styles not loading**: Ensure \`app.css\` is imported in \`__root.tsx\`
4. **Router not found**: Make sure \`routeTree.gen.ts\` is generated (run dev server)

## ✅ Next Steps

1. Run \`npm run dev\` to start the development server
2. Check for TypeScript errors
3. Test all routes and functionality
4. Update tests
5. Review and remove backup files once migration is verified
`;
    const guidePath = path_1.default.join(rootDir, "MIGRATION_GUIDE.md");
    fs_1.default.writeFileSync(guidePath, guide, "utf8");
    console.log(`✅ Created comprehensive migration guide at ${guidePath}`);
}
/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir) {
    const files = [];
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
                files.push(...getAllFiles(fullPath));
            }
        }
        else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}
//# sourceMappingURL=handleAdvancedFeatures.js.map