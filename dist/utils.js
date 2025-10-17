"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectPackageManager = detectPackageManager;
const fs_1 = require("fs");
const path_1 = require("path");
function detectPackageManager() {
    const cwd = process.cwd();
    if ((0, fs_1.existsSync)((0, path_1.join)(cwd, "pnpm-lock.yaml")))
        return "pnpm";
    if ((0, fs_1.existsSync)((0, path_1.join)(cwd, "yarn.lock")))
        return "yarn";
    return "npm";
}
//# sourceMappingURL=utils.js.map