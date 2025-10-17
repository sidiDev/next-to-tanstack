"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDependencies = handleDependencies;
const execa_1 = require("execa");
const utils_1 = require("../utils");
function handleDependencies() {
    return __awaiter(this, void 0, void 0, function* () {
        const pm = (0, utils_1.detectPackageManager)();
        yield Promise.all([
            yield (0, execa_1.execa)(pm, ["uninstall", "next", "@tailwindcss/postcss"], {
                cwd: process.cwd(),
                stdio: "inherit",
            }),
            yield (0, execa_1.execa)("rm", ["next.config.*", "postcss.config.*"], {
                cwd: process.cwd(),
                stdio: "inherit",
                shell: true,
            }),
            yield (0, execa_1.execa)(pm, ["install", "@tanstack/react-router", "@tanstack/react-start"], {
                cwd: process.cwd(),
                stdio: "inherit",
            }),
            yield (0, execa_1.execa)(pm, [
                "install",
                "-D",
                "vite",
                "@vitejs/plugin-react",
                "@tailwindcss/vite",
                "tailwindcss",
                "vite-tsconfig-paths",
            ], {
                cwd: process.cwd(),
                stdio: "inherit",
            }),
        ]);
    });
}
//# sourceMappingURL=handleDependencies.js.map