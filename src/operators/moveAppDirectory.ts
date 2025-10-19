import fs from "fs";
import { join } from "path";

// We will move app directory to src directory if useSrc is false (app is at root level)
export function moveAppDirectory(useSrc: boolean) {
  if (!useSrc) {
    const appDir = join(process.cwd(), "app");
    const srcAppDir = join(process.cwd(), "src", "app");

    // Check if src directory exists, if not create it
    const srcDir = join(process.cwd(), "src");
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Move app directory into src/app
    if (fs.existsSync(appDir) && !fs.existsSync(srcAppDir)) {
      fs.renameSync(appDir, srcAppDir);
      console.log("✔ Moved app directory to src/app");
    }
  }
}
