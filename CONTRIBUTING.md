# Contributing

Thanks for your interest! This project is in beta and needs help.

## Setup

```bash
git clone https://github.com/sididev/next-to-tanstack.git
cd next-to-tanstack
npm install
npm run build
```

## Project Structure

```
src/
├── index.ts              # CLI entry point
├── utils.ts              # Helper functions
└── operators/            # Migration steps
    ├── adaptHomePage.ts           # Convert page.tsx → index.tsx
    ├── adaptRootLayout.ts         # Convert layout.tsx → __root.tsx with font handling
    ├── cleanupLegacyArtifacts.ts  # Remove .next/ and .turbo/ directories
    ├── handleDependencies.ts      # Swap Next.js packages for TanStack
    ├── initProjectConfig.ts       # Generate vite.config.ts, tsconfig.json, etc
    └── moveAppDirectory.ts        # Move app/ to src/app/ if needed
```

## Testing

No automated tests yet. Test manually:

1. In this project, link it globally:
   ```bash
   npm link
   ```
2. Create or navigate to a test Next.js project
3. Run the command:
   ```bash
   next-to-tanstack migrate
   # or use the short alias
   n2t migrate
   ```
4. Check the output files

## Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build` (or `npm run watch` for auto-rebuild)
3. Test on a real Next.js project
4. Open a pull request

## What needs work

High priority:

- **Support for additional pages**: Handle pages beyond just the home page
- **API routes transformation**: Convert Next.js API routes to TanStack equivalents
- **Nested routes**: Support for folder structure routing
- **Tests**: Any kind of automated testing!
- **Error handling**: Better messages when things go wrong
- **Dry-run mode**: Preview changes without modifying files

Code improvements:

- Better AST transformations
- Handle edge cases
- Support for more Next.js features
- TypeScript improvements

## Code Style

Just match the existing style:

- TypeScript
- 2 spaces
- Clear variable names
- Comments for complex parts

## Questions?

Open an issue on GitHub. This is a learning project - questions are welcome!

---

Remember: this is beta software. Every contribution helps make it better!
