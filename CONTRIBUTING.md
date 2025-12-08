# Contributing

Thanks for your interest! This project is currently in beta.

## How to Contribute

**At this time, we are only accepting issue reports.** Please do not submit pull requests.

If you encounter bugs, have feature requests, or want to discuss improvements, please [open an issue on GitHub](https://github.com/sididev/next-to-tanstack/issues).

## What to Report

We'd love to hear about:

- **Bugs**: Things that don't work as expected
- **Feature requests**: Ideas for new functionality
- **Documentation issues**: Parts that are unclear or missing
- **Use cases**: How you're using the tool and what challenges you face

High priority items we're aware of:

- **Support for additional pages**: Handle pages beyond just the home page
- **API routes transformation**: Convert Next.js API routes to TanStack equivalents
- **Nested routes**: Support for folder structure routing
- **Tests**: Any kind of automated testing
- **Error handling**: Better messages when things go wrong
- **Dry-run mode**: Preview changes without modifying files

## Project Structure

For reference, here's the current structure:

```
src/
├── index.ts              # CLI entry point
├── utils.ts              # Helper functions
└── operators/            # Migration steps
    ├── adaptHomePage.ts
    ├── adaptRootLayout.ts
    ├── handleDependencies.ts
    ├── initProjectConfig.ts
    └── moveAppDirectory.ts
```

## Questions?

Open an issue on GitHub. This is a learning project - questions and feedback are welcome!

---

Remember: this is beta software. Your feedback helps make it better!
