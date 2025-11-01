# next-to-tanstack

> ⚠️ **Beta Software**: This tool is under active development. It currently handles basic migrations but expect bugs and missing features.

A CLI tool to migrate Next.js projects to TanStack Start.

## Quick Start

Insatll the CLI in your project using:

```bash
pnpm add next-to-tanstack
```

or

```bash
npm add next-to-tanstack
```

Run the command:

```bash
npx next-to-tanstack migrate
```

Or use the short alias:

```bash
npx n2t migrate
```

**Important**: This modifies your project files. Commit your changes to git first!

## What it does

- Swaps Next.js dependencies for TanStack Router and Start
- Converts `layout.tsx` → `__root.tsx`
- Converts `page.tsx` → `index.tsx`
- Creates `vite.config.ts` and updates project config
- Transforms Next.js code to TanStack equivalents

## Current Limitations

⚠️ **This is beta software!** Currently it only handles:

- Root layout and home page (basic projects)
- App Router projects (not Pages Router)

**Coming soon:**

- Support for additional pages and nested routes
- API routes transformation
- Dynamic routes
- Better error handling

## What you'll need to do manually

After migration:

- Review all transformed files
- Test your application thoroughly
- Handle any API routes
- Configure deployment settings
- Adjust dynamic routes

## Requirements

- Node.js 18+
- Next.js project with App Router
- Git (to track changes)

## Contributing

Want to help? Check out [CONTRIBUTING.md](./CONTRIBUTING.md)

This tool is still early and needs your feedback and contributions!

## License

ISC
