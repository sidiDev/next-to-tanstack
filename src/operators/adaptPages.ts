import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { adaptStaticPage } from "../page-adapters/adaptStaticPage";
import { convertDynamicSegment } from "../utils";

type PageInfo = {
  filename: string;
  directories: string;
};

export async function adaptPages(useSrc: boolean) {
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
    const isPage =
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".js");
    if (file.isFile() && isPage) {
      const isDynamicSegment = relativePath.includes("$");
      pages.push({
        filename: file.name,
        directories: relativePath,
      });
      adaptStaticPage(
        join(pagePath, file.name),
        file.name,
        relativePath,
        isDynamicSegment
      );
    } else if (file.isDirectory()) {
      // Convert dynamic segments like [slug] to $slug for TanStack Router
      const convertedName = convertDynamicSegment(file.name);
      const subPages = adaptPage(
        pagePath,
        file.name,
        `${relativePath}/${convertedName}`
      );
      pages.push(...subPages);
    }
  });

  return pages;
}
