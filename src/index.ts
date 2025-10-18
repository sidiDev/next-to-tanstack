#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { handleDependencies } from "./operators/handleDependencies";
import { initProjectConfig } from "./operators/initProjectConfig";
import { adaptRootLayout } from "./operators/adaptRootLayout";
import { adaptHomePage } from "./operators/adaptHomePage";
import fs from "fs";
import path from "path";

const program = new Command();

program
  .version("1.0.0")
  .name("next-to-tanstack")
  .description("A CLI to migrate Next.js projects to Tanstack start");

program
  .command("migrate")
  .description("Migrate a Next.js project to Tanstack")
  .action(async () => {
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
    const useSrc = fs.existsSync(path.join(process.cwd(), "src", "app"));
    const hasApp = fs.existsSync(
      path.join(process.cwd(), useSrc ? "src/app" : "app")
    );

    // await handleDependencies();
    // await initProjectConfig();
    // await adaptRootLayout(useSrc);
    await adaptHomePage(useSrc);
    // console.log(process.cwd());
  });

program.parse();
