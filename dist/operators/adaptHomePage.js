"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptHomePage = adaptHomePage;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const t = __importStar(require("@babel/types"));
function adaptHomePage(useSrc) {
    const appDir = useSrc
        ? (0, path_1.join)(process.cwd(), "src", "app")
        : (0, path_1.join)(process.cwd(), "app");
    const appFiles = fs_1.default.readdirSync(appDir);
    // Regex to match layout.tsx or layout.js and capture the extension
    const pageRegex = /^page\.(tsx|js|jsx)$/;
    // Find the layout file
    const pageFile = appFiles.find((file) => pageRegex.test(file));
    if (pageFile) {
        const match = pageFile.match(pageRegex);
        const extension = match === null || match === void 0 ? void 0 : match[1]; // This will be either 'tsx' or 'js'
        const pagePath = (0, path_1.join)(appDir, pageFile);
        const page = fs_1.default.readFileSync(pagePath, "utf8");
        const ast = (0, parser_1.parse)(page, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });
        let metadataFound = false;
        (0, traverse_1.default)(ast, {
            enter(path) {
                // console.log(path.node.type);
            },
            Program(path) {
                const tanstackImports = t.importDeclaration([
                    t.importSpecifier(t.identifier("Outlet"), t.identifier("Outlet")),
                    t.importSpecifier(t.identifier("createFileRoute"), t.identifier("createFileRoute")),
                    t.importSpecifier(t.identifier("HeadContent"), t.identifier("HeadContent")),
                    t.importSpecifier(t.identifier("Scripts"), t.identifier("Scripts")),
                ], t.stringLiteral("@tanstack/react-router"));
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
                if (source == "next" ||
                    source == "next/script" ||
                    source == "next/image") {
                    path.remove();
                }
                if (source.endsWith(".css")) {
                    const name = source.replace(/^\.\/(.*?)\.css$/, "$1css");
                    const importCss = t.importDeclaration([t.importDefaultSpecifier(t.identifier(name))], t.stringLiteral(source));
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
                                        const metaItems = [];
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
                                                    metaItems.push(t.objectExpression([
                                                        t.objectProperty(t.identifier("title"), prop.value),
                                                    ]));
                                                }
                                                else if (key === "description") {
                                                    // { description: "value" } -> { name: "description", content: "value" }
                                                    metaItems.push(t.objectExpression([
                                                        t.objectProperty(t.identifier("name"), t.stringLiteral("description")),
                                                        t.objectProperty(t.identifier("content"), prop.value),
                                                    ]));
                                                }
                                                else {
                                                    metaItems.push(t.objectExpression([
                                                        t.objectProperty(t.identifier("name"), t.stringLiteral(key)),
                                                        t.objectProperty(t.identifier("content"), prop.value),
                                                    ]));
                                                }
                                            }
                                        });
                                        // Create the Route export
                                        const routeExport = t.exportNamedDeclaration(t.variableDeclaration("const", [
                                            t.variableDeclarator(t.identifier("Route"), t.callExpression(t.callExpression(t.identifier("createFileRoute"), [
                                                t.stringLiteral("/"),
                                            ]), [
                                                t.objectExpression([
                                                    // head property
                                                    t.objectProperty(t.identifier("head"), t.arrowFunctionExpression([], t.objectExpression([
                                                        t.objectProperty(t.identifier("meta"), t.arrayExpression(metaItems)),
                                                    ]))),
                                                    t.objectProperty(t.identifier("component"), t.identifier("Home")),
                                                ]),
                                            ])),
                                        ]));
                                        // Replace the metadata export with the Route export
                                        path.replaceWith(routeExport);
                                    }
                                }
                                else {
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
                    const regularFunc = t.functionDeclaration(funcDeclaration.id, funcDeclaration.params, funcDeclaration.body, funcDeclaration.generator, funcDeclaration.async);
                    path.replaceWith(regularFunc);
                }
                else if (t.isArrowFunctionExpression(declaration)) {
                    const namedFunction = t.variableDeclaration("const", [
                        t.variableDeclarator(t.identifier("Home"), declaration),
                    ]);
                    path.replaceWith(namedFunction);
                }
            },
            ExpressionStatement(path) {
                if (t.isJSXElement(path.node.expression)) {
                    if (t.isJSXIdentifier(path.node.expression.openingElement.name)) {
                        if (path.node.expression.openingElement.name.name === "Image") {
                            const imageElement = t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier("img"), path.node.expression.openingElement.attributes, true), null, []);
                            path.replaceWith(imageElement);
                        }
                    }
                }
            },
        });
        // If metadata was not found
        if (!metadataFound) {
            (0, traverse_1.default)(ast, {
                Program(path) {
                    const metaItems = [];
                    const routeExport = t.exportNamedDeclaration(t.variableDeclaration("const", [
                        t.variableDeclarator(t.identifier("Route"), t.callExpression(t.callExpression(t.identifier("createFileRoute"), [
                            t.stringLiteral("/"),
                        ]), [
                            t.objectExpression([
                                // head property
                                t.objectProperty(t.identifier("head"), t.arrowFunctionExpression([], t.objectExpression([
                                    t.objectProperty(t.identifier("meta"), t.arrayExpression(metaItems)),
                                ]))),
                                t.objectProperty(t.identifier("component"), t.identifier("Home")),
                            ]),
                        ])),
                    ]));
                    // Add it after imports, before other exports
                    const lastImportIndex = path.node.body.findIndex((node) => !t.isImportDeclaration(node));
                    path.node.body.splice(lastImportIndex, 0, routeExport);
                },
            });
        }
        const transformed = (0, generator_1.default)(ast).code;
        fs_1.default.writeFileSync(pagePath, transformed);
        fs_1.default.renameSync(pagePath, pagePath.replace("page", "index"));
        // console.log(transformed);
    }
    else {
        console.error("No page.tsx or page.js found in app directory");
    }
}
//# sourceMappingURL=adaptHomePage.js.map