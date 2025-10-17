import fs from "fs";
import { join } from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

export function adaptRootLayout(useSrc: boolean) {
  const appDir = useSrc
    ? join(process.cwd(), "src", "app")
    : join(process.cwd(), "app");

  const appFiles = fs.readdirSync(appDir);

  // Regex to match layout.tsx or layout.js and capture the extension
  const layoutRegex = /^layout\.(tsx|js|jsx)$/;

  // Find the layout file
  const layoutFile = appFiles.find((file) => layoutRegex.test(file));

  if (layoutFile) {
    const match = layoutFile.match(layoutRegex);
    const extension = match?.[1]; // This will be either 'tsx' or 'js'

    const rootLayoutPath = join(appDir, layoutFile);
    const rootLayout = fs.readFileSync(rootLayoutPath, "utf8");

    const ast = parse(rootLayout, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let metadataFound = false;

    const stylesheetsMeta: t.ObjectExpression[] = [];

    // "./globals.css"

    traverse(ast, {
      //   enter(path) {
      //     console.log(path.node.type);
      //   },
      ImportDeclaration(path) {
        const value = path.node.source.value;
        if (value.endsWith(".css")) {
          const name = value.replace(/^\.\/(.*?)\.css$/, "$1css");
          stylesheetsMeta.push(
            t.objectExpression([
              t.objectProperty(t.identifier("href"), t.identifier(name)),
              t.objectProperty(
                t.identifier("rel"),
                t.stringLiteral("stylesheet")
              ),
            ])
          );
        }
      },
    });

    traverse(ast, {
      Program(path) {
        const tanstackImports = t.importDeclaration(
          [
            t.importSpecifier(t.identifier("Outlet"), t.identifier("Outlet")),
            t.importSpecifier(
              t.identifier("createRootRoute"),
              t.identifier("createRootRoute")
            ),
            t.importSpecifier(
              t.identifier("HeadContent"),
              t.identifier("HeadContent")
            ),
            t.importSpecifier(t.identifier("Scripts"), t.identifier("Scripts")),
          ],
          t.stringLiteral("@tanstack/react-router")
        );

        // console.log("path.node.body", path.node.body);

        path.node.body.unshift(tanstackImports);
      },
      ImportDeclaration(path) {
        // console.log(path.node.source.value);
        const source = path.node.source.value;
        if (source == "next" || source == "next/script") {
          path.remove();
        }

        if (source.endsWith(".css")) {
          const name = source.replace(/^\.\/(.*?)\.css$/, "$1css");
          const importCss = t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(name as string))],
            t.stringLiteral(source)
          );
          path.replaceWith(importCss);
          path.skip();
        }
      },
      ExportDefaultDeclaration(path) {
        if (
          t.isFunctionDeclaration(path.node.declaration) &&
          path.node.declaration.id?.name === "RootLayout"
        ) {
          const funcDeclaration = path.node.declaration;

          // Remove parameters (no more children prop)
          funcDeclaration.params = [];

          // Transform the JSX body
          if (t.isBlockStatement(funcDeclaration.body)) {
            traverse(
              funcDeclaration,
              {
                // Find and transform the JSX structure
                JSXElement(jsxPath) {
                  // Add <head> with <HeadContent /> if <html> is found
                  const openingElement = jsxPath.node.openingElement;
                  if (
                    t.isJSXIdentifier(openingElement.name) &&
                    openingElement.name.name === "html"
                  ) {
                    // Find <body> element among children
                    const bodyIndex = jsxPath.node.children.findIndex(
                      (child) => {
                        return (
                          t.isJSXElement(child) &&
                          t.isJSXIdentifier(child.openingElement.name) &&
                          child.openingElement.name.name === "body"
                        );
                      }
                    );

                    if (bodyIndex !== -1) {
                      // Create <head><HeadContent /></head>
                      const headElement = t.jsxElement(
                        t.jsxOpeningElement(t.jsxIdentifier("head"), [], false),
                        t.jsxClosingElement(t.jsxIdentifier("head")),
                        [
                          t.jsxText("\n        "),
                          t.jsxElement(
                            t.jsxOpeningElement(
                              t.jsxIdentifier("HeadContent"),
                              [],
                              true
                            ),
                            null,
                            [],
                            true
                          ),
                          t.jsxText("\n      "),
                        ],
                        false
                      );

                      // Insert <head> before <body>
                      jsxPath.node.children.splice(
                        bodyIndex,
                        0,
                        t.jsxText("\n      "),
                        headElement
                      );
                    }
                  }

                  // Add <Scripts /> in <body> after children/Outlet
                  if (
                    t.isJSXIdentifier(openingElement.name) &&
                    openingElement.name.name === "body"
                  ) {
                    const scriptsElement = t.jsxElement(
                      t.jsxOpeningElement(t.jsxIdentifier("Scripts"), [], true),
                      null,
                      [],
                      true
                    );

                    // Find where {children} or <Outlet /> is
                    let insertIndex = -1;
                    for (
                      let i = jsxPath.node.children.length - 1;
                      i >= 0;
                      i--
                    ) {
                      const child = jsxPath.node.children[i];

                      // Check for <Outlet /> or {children}
                      if (t.isJSXElement(child)) {
                        const childName = child.openingElement.name;
                        if (
                          t.isJSXIdentifier(childName) &&
                          childName.name === "Outlet"
                        ) {
                          insertIndex = i + 1;
                          break;
                        }
                      } else if (t.isJSXExpressionContainer(child)) {
                        if (
                          t.isIdentifier(child.expression) &&
                          child.expression.name === "children"
                        ) {
                          insertIndex = i + 1;
                          break;
                        }
                      }
                    }

                    if (insertIndex !== -1) {
                      jsxPath.node.children.splice(
                        insertIndex,
                        0,
                        t.jsxText("\n        "),
                        scriptsElement
                      );
                    }
                  }
                },

                // Replace {children} with <Outlet />
                JSXExpressionContainer(jsxPath) {
                  if (
                    t.isIdentifier(jsxPath.node.expression) &&
                    jsxPath.node.expression.name === "children"
                  ) {
                    const outletElement = t.jsxElement(
                      t.jsxOpeningElement(t.jsxIdentifier("Outlet"), [], true),
                      null,
                      [],
                      true
                    );

                    jsxPath.replaceWith(outletElement);
                  }
                },
              },
              path.scope,
              path
            );
          }

          // Convert from default export to named declaration
          const regularFunc = t.functionDeclaration(
            funcDeclaration.id,
            funcDeclaration.params,
            funcDeclaration.body,
            funcDeclaration.generator,
            funcDeclaration.async
          );

          // Replace the default export with just the function declaration
          path.replaceWith(regularFunc);
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach((declaration) => {
              if (t.isIdentifier(declaration.id)) {
                if (declaration.id.name === "metadata") {
                  metadataFound = true;
                  const init = declaration.init;

                  if (t.isObjectExpression(init)) {
                    const metaItems = [
                      // Default meta tags
                      t.objectExpression([
                        t.objectProperty(
                          t.identifier("charSet"),
                          t.stringLiteral("utf-8")
                        ),
                      ]),
                      t.objectExpression([
                        t.objectProperty(
                          t.identifier("name"),
                          t.stringLiteral("viewport")
                        ),
                        t.objectProperty(
                          t.identifier("content"),
                          t.stringLiteral("width=device-width, initial-scale=1")
                        ),
                      ]),
                    ];

                    // Transform each metadata property to meta format
                    init.properties.forEach((prop) => {
                      if (t.isObjectProperty(prop)) {
                        const key = t.isIdentifier(prop.key)
                          ? prop.key.name
                          : t.isStringLiteral(prop.key)
                          ? prop.key.value
                          : null;

                        if (key === "title") {
                          // { title: "value" } -> { title: "value" }
                          metaItems.push(
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier("title"),
                                prop.value
                              ),
                            ])
                          );
                        } else if (key === "description") {
                          // { description: "value" } -> { name: "description", content: "value" }
                          metaItems.push(
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier("name"),
                                t.stringLiteral("description")
                              ),
                              t.objectProperty(
                                t.identifier("content"),
                                prop.value
                              ),
                            ])
                          );
                        } else {
                          metaItems.push(
                            t.objectExpression([
                              t.objectProperty(
                                t.identifier("name"),
                                t.stringLiteral(key as string)
                              ),
                              t.objectProperty(
                                t.identifier("content"),
                                prop.value
                              ),
                            ])
                          );
                        }
                      }
                    });

                    // Create the Route export
                    const routeExport = t.exportNamedDeclaration(
                      t.variableDeclaration("const", [
                        t.variableDeclarator(
                          t.identifier("Route"),
                          t.callExpression(t.identifier("createRootRoute"), [
                            t.objectExpression([
                              // head property
                              t.objectProperty(
                                t.identifier("head"),
                                t.arrowFunctionExpression(
                                  [],
                                  t.objectExpression([
                                    t.objectProperty(
                                      t.identifier("meta"),
                                      t.arrayExpression(metaItems)
                                    ),
                                    t.objectProperty(
                                      t.identifier("links"),
                                      t.arrayExpression(stylesheetsMeta)
                                    ),
                                  ])
                                )
                              ),
                              t.objectProperty(
                                t.identifier("component"),
                                t.identifier("RootLayout")
                              ),
                            ]),
                          ])
                        ),
                      ])
                    );

                    // Replace the metadata export with the Route export
                    path.replaceWith(routeExport);
                  }
                } else {
                }
              }
            });
          }
        }
      },
    });

    // If metadata was not found
    if (!metadataFound) {
      traverse(ast, {
        Program(path) {
          const metaItems = [
            t.objectExpression([
              t.objectProperty(
                t.identifier("charSet"),
                t.stringLiteral("utf-8")
              ),
            ]),
            t.objectExpression([
              t.objectProperty(
                t.identifier("name"),
                t.stringLiteral("viewport")
              ),
              t.objectProperty(
                t.identifier("content"),
                t.stringLiteral("width=device-width, initial-scale=1")
              ),
            ]),
          ];

          const routeExport = t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("Route"),
                t.callExpression(t.identifier("createRootRoute"), [
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("head"),
                      t.arrowFunctionExpression(
                        [],
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier("meta"),
                            t.arrayExpression(metaItems)
                          ),
                          t.objectProperty(
                            t.identifier("links"),
                            t.arrayExpression(stylesheetsMeta)
                          ),
                        ])
                      )
                    ),
                    t.objectProperty(
                      t.identifier("component"),
                      t.identifier("RootLayout")
                    ),
                  ]),
                ])
              ),
            ])
          );

          // Add it after imports, before other exports
          const lastImportIndex = path.node.body.findIndex(
            (node) => !t.isImportDeclaration(node)
          );
          path.node.body.splice(lastImportIndex, 0, routeExport);
        },
      });
    }

    const transformed = generate(ast).code;
    fs.writeFileSync(rootLayoutPath, transformed);
    fs.renameSync(rootLayoutPath, rootLayoutPath.replace("layout", "__root"));
    // console.log(transformed);
  } else {
    console.error("No layout.tsx or layout.js found in app directory");
  }
}
