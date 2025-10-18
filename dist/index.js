#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const adaptHomePage_1 = require("./operators/adaptHomePage");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const program = new commander_1.Command();
program
    .version("1.0.0")
    .name("next-to-tanstack")
    .description("A CLI to migrate Next.js projects to Tanstack start");
program
    .command("migrate")
    .description("Migrate a Next.js project to Tanstack")
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    // const answers = await inquirer.prompt([
    //   {
    //     type: "confirm",
    //     name: "modify",
    //     message: "✔ ⚠️  This will modify your project. Continue?",
    //     default: true,
    //   },
    // ]);
    // if (!answers.modify) {
    //   console.log("❌ Migration cancelled");
    //   process.exit(1);
    // }
    // Detect project structure
    const useSrc = fs_1.default.existsSync(path_1.default.join(process.cwd(), "src", "app"));
    const hasApp = fs_1.default.existsSync(path_1.default.join(process.cwd(), useSrc ? "src/app" : "app"));
    // await handleDependencies();
    // await initProjectConfig();
    // await adaptRootLayout(useSrc);
    yield (0, adaptHomePage_1.adaptHomePage)(useSrc);
    // console.log(process.cwd());
}));
program.parse();
//# sourceMappingURL=index.js.map