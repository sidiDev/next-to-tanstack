import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { adaptStaticPage } from "../page-adapters/adaptStaticPage";

type PageInfo = {
  filename: string;
  directories: string;
};

export async function adaptPages(useSrc: boolean) {
  console.log(useSrc);

  const cwd = process.cwd();
  const appDir = useSrc ? join(cwd, "src", "app") : join(cwd, "app");
  const staticPageDirs = readdirSync(appDir, {
    withFileTypes: true,
  }).filter((file) => file.isDirectory() && file.name !== "api");

  staticPageDirs.forEach((dir) => {
    adaptPage(appDir, dir.name, `/${dir.name}`);
  });
}

function adaptPage(
  appDir: string,
  name: string,
  relativePath: string
): PageInfo[] {
  const pagePath = join(appDir, name);
  const page = readdirSync(pagePath, { withFileTypes: true });
  const pages: PageInfo[] = [];

  page.forEach((file) => {
    // this is long but it's faster than using a regex
    const isDynamicSegment = /^\[[^\[\]]+\]$/.test(file.name);
    const isPage =
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".js");
    if (file.isFile() && isPage) {
      pages.push({
        filename: file.name,
        directories: relativePath,
      });
      adaptStaticPage(join(pagePath, file.name), file.name, relativePath);
    } else if (file.isDirectory() && !isDynamicSegment) {
      const subPages = adaptPage(
        pagePath,
        file.name,
        `${relativePath}/${file.name}`
      );
      pages.push(...subPages);
    }
  });

  return pages;
}
