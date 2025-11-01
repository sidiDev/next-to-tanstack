import { readFileSync, writeFileSync, renameSync } from "fs";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import {
  imageImportDeclaration,
  linkImportDeclaration,
  LinkElement,
  ImageElement,
  convertDynamicPath,
} from "../utils";

export function adaptStaticPage(
  pagePath: string,
  name: string,
  relativePath: string,
  isDynamicSegment: boolean
) {
  const page = readFileSync(pagePath, "utf8");

  const extension = name.split(".").pop();

  const ast = parse(page, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  let metadataFound = false;
  let componentName = "Component"; // Default component name

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

      if (source == "next" || source == "next/script") {
        path.remove();
      }

      imageImportDeclaration(path);
      linkImportDeclaration(path);
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
                            t.objectProperty(t.identifier("title"), prop.value),
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
                            t.stringLiteral(relativePath),
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
                                t.identifier(componentName)
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
        // Capture the component name from the function declaration
        if (funcDeclaration.id) {
          componentName = funcDeclaration.id.name;
        }
        const regularFunc = t.functionDeclaration(
          funcDeclaration.id,
          funcDeclaration.params,
          funcDeclaration.body,
          funcDeclaration.generator,
          funcDeclaration.async
        );

        path.replaceWith(regularFunc);
      } else if (t.isArrowFunctionExpression(declaration)) {
        // Generate component name from file name
        const baseName = name.replace(/\.(tsx|jsx|ts|js)$/, "");
        componentName =
          baseName === "page"
            ? "Component"
            : baseName.charAt(0).toUpperCase() + baseName.slice(1);

        const namedFunction = t.variableDeclaration("const", [
          t.variableDeclarator(t.identifier(componentName), declaration),
        ]);
        path.replaceWith(namedFunction);
      }
    },
    JSXElement(path) {
      LinkElement(path);
      ImageElement(path);
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
                  t.stringLiteral(relativePath),
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
                      t.identifier(componentName)
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

  function getFilePath() {
    if (!isDynamicSegment)
      return pagePath.replace(`page.${extension}`, `index.${extension}`);
    return (
      convertDynamicPath(pagePath.replace(`/page.${extension}`, "")) +
      `.${extension}`
    );
  }

  writeFileSync(pagePath, transformed);
  renameSync(pagePath, getFilePath());
  // console.log(transformed);
}
