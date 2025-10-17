import fs from "fs";
import { join } from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

export function adaptHomePage(useSrc: boolean) {
  const appDir = useSrc
    ? join(process.cwd(), "src", "app")
    : join(process.cwd(), "app");

  const appFiles = fs.readdirSync(appDir);

  // Regex to match layout.tsx or layout.js and capture the extension
  const layoutRegex = /^page\.(tsx|js|jsx)$/;

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

    traverse(ast, {
      enter(path) {
        // console.log(path.node.type);
      },
      Program(path) {
        const tanstackImports = t.importDeclaration(
          [
            t.importSpecifier(t.identifier("Outlet"), t.identifier("Outlet")),
            t.importSpecifier(
              t.identifier("createFileRoute"),
              t.identifier("createFileRoute")
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
      Directive(path) {
        if (path.node.value.value == "use client") {
          path.remove();
        }
      },
      ImportDeclaration(path) {
        // console.log(path.node.source.value);
        const source = path.node.source.value;

        if (
          source == "next" ||
          source == "next/script" ||
          source == "next/image"
        ) {
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
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach((declaration) => {
              if (t.isIdentifier(declaration.id)) {
                if (declaration.id.name === "metadata") {
                  metadataFound = true;
                  const init = declaration.init;

                  if (t.isObjectExpression(init)) {
                    const metaItems: t.ObjectExpression[] = [];

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
                          t.callExpression(
                            t.callExpression(t.identifier("createFileRoute"), [
                              t.stringLiteral("/"),
                            ]),
                            [
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
                                    ])
                                  )
                                ),
                                t.objectProperty(
                                  t.identifier("component"),
                                  t.identifier("Home")
                                ),
                              ]),
                            ]
                          )
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
      ExportDefaultDeclaration(path) {
        const declaration = path.node.declaration;

        if (t.isFunctionDeclaration(declaration)) {
          const funcDeclaration = declaration;
          const regularFunc = t.functionDeclaration(
            funcDeclaration.id,
            funcDeclaration.params,
            funcDeclaration.body,
            funcDeclaration.generator,
            funcDeclaration.async
          );

          path.replaceWith(regularFunc);
        } else if (t.isArrowFunctionExpression(declaration)) {
          const namedFunction = t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier("Home"), declaration),
          ]);
          path.replaceWith(namedFunction);
        }
      },
    });

    // If metadata was not found
    if (!metadataFound) {
      traverse(ast, {
        Program(path) {
          const metaItems: t.ObjectExpression[] = [];

          const routeExport = t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("Route"),
                t.callExpression(
                  t.callExpression(t.identifier("createFileRoute"), [
                    t.stringLiteral("/"),
                  ]),
                  [
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
                          ])
                        )
                      ),
                      t.objectProperty(
                        t.identifier("component"),
                        t.identifier("Home")
                      ),
                    ]),
                  ]
                )
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
    // fs.writeFileSync(rootLayoutPath, transformed);
    // fs.renameSync(rootLayoutPath, rootLayoutPath.replace("layout", "__root"));
    console.log(transformed);
  } else {
    console.error("No page.tsx or page.js found in app directory");
  }
}
