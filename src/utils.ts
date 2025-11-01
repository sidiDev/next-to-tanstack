import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";
import { execa } from "execa";

export function detectPackageManager(): "pnpm" | "yarn" | "npm" {
  const cwd = process.cwd();

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export function isPackageInstalled(packageName: string): boolean {
  const cwd = process.cwd();

  // Check package.json first
  const packageJson = JSON.parse(
    readFileSync(join(cwd, "package.json"), "utf8")
  );

  const inPackageJson =
    packageJson.dependencies?.[packageName] !== undefined ||
    packageJson.devDependencies?.[packageName] !== undefined;

  // Optionally also check if it exists in node_modules
  const inNodeModules = existsSync(join(cwd, "node_modules", packageName));

  return inPackageJson && inNodeModules;
}

export function getNextPackages(): string[] {
  const cwd = process.cwd();
  const packageJson = JSON.parse(
    readFileSync(join(cwd, "package.json"), "utf8")
  );
  return Object.keys(packageJson.dependencies).filter(
    (dep) => dep.startsWith("@next") || dep.includes("eslint-config-next")
  );
}

export async function installPackages(
  packageNames: string[],
  isDev: boolean = false
): Promise<void> {
  const pm = detectPackageManager();
  const args = isDev
    ? ["install", "-D", ...packageNames]
    : ["install", ...packageNames];

  await execa(pm, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

export async function imageImportDeclaration(
  path: NodePath<t.ImportDeclaration>
) {
  const source = path.node.source.value;
  if (source == "next/image") {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier("Image"), t.identifier("Image"))],
      t.stringLiteral("@unpic/react")
    );
    path.replaceWith(importDeclaration);

    if (!isPackageInstalled("@unpic/react")) {
      await installPackages(["@unpic/react"]);
    }
  }
}

export async function linkImportDeclaration(
  path: NodePath<t.ImportDeclaration>
) {
  const source = path.node.source.value;
  if (source == "next/link") {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier("Link"), t.identifier("Link"))],
      t.stringLiteral("@tanstack/react-router")
    );
    path.replaceWith(importDeclaration);
  }
}

export function LinkElement(path: NodePath<t.JSXElement>) {
  if (
    t.isJSXIdentifier(path.node.openingElement.name) &&
    path.node.openingElement.name?.name === "Link"
  ) {
    const filteredAttributes = path.node.openingElement.attributes.flatMap(
      (attr) => {
        if (!t.isJSXAttribute(attr)) {
          return attr;
        }

        if (t.isJSXIdentifier(attr.name) && attr.name.name === "href") {
          return t.jsxAttribute(t.jsxIdentifier("to"), attr.value);
        }

        return attr;
      }
    );

    const hasChildren = path.node.children.length > 0;
    const linkElement = t.jsxElement(
      t.jsxOpeningElement(
        t.jsxIdentifier("Link"),
        filteredAttributes,
        !hasChildren
      ),
      hasChildren ? t.jsxClosingElement(t.jsxIdentifier("Link")) : null,
      path.node.children
    );
    path.replaceWith(linkElement);
    path.skip();
  }
}

export function ImageElement(path: NodePath<t.JSXElement>) {
  if (
    t.isJSXIdentifier(path.node.openingElement.name) &&
    path.node.openingElement.name?.name === "Image"
  ) {
    const filteredAttributes = path.node.openingElement.attributes.flatMap(
      (attr) => {
        if (!t.isJSXAttribute(attr)) {
          return attr;
        }

        if (t.isJSXIdentifier(attr.name) && attr.name.name === "priority") {
          return t.jsxAttribute(
            t.jsxIdentifier("loading"),
            t.stringLiteral("lazy")
          );
        }

        return attr;
      }
    );

    const imageElement = t.jsxElement(
      t.jsxOpeningElement(t.jsxIdentifier("Image"), filteredAttributes, true),
      null,
      []
    );
    path.replaceWith(imageElement);
    path.skip();
  }
}

/**
 * Converts a single Next.js dynamic route segment to TanStack Router syntax
 * Examples:
 * - [slug] -> $slug
 * - [id] -> $id
 * - [...slug] -> $slug (catch-all routes)
 * - [[...slug]] -> $slug (optional catch-all routes)
 */
export function convertDynamicSegment(segment: string): string {
  if (/^\[{1,2}\.{0,3}[^\[\]]+\]{1,2}$/.test(segment)) {
    return "$" + segment.replace(/^\[{1,2}\.{0,3}/, "").replace(/\]{1,2}$/, "");
  }
  return segment;
}

/**
 * Converts a full path with Next.js dynamic route syntax to TanStack Router syntax
 * Examples:
 * - /blog/[slug] -> /blog/$slug
 * - app/blog/[slug] -> app/blog/$slug
 * - /posts/[category]/[id] -> /posts/$category/$id
 * - /docs/[...slug] -> /docs/$slug
 */
export function convertDynamicPath(path: string): string {
  const segments = path.split(/[\/\\]/);

  // Convert each segment and rejoin
  const convertedSegments = segments.map((segment) =>
    convertDynamicSegment(segment)
  );

  const separator = path.includes("\\") ? "\\" : "/";
  return convertedSegments.join(separator);
}
