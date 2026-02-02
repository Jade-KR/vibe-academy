import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

export interface FileOperationOptions {
  /** When true, log what would happen without modifying files */
  dryRun?: boolean;
}

const LOG_PREFIX = {
  done: "  \u2713",
  warn: "  \u26A0",
  dryRun: "  [dry-run]",
} as const;

// ---------------------------------------------------------------------------
// Directory / File removal
// ---------------------------------------------------------------------------

export async function removeDirectory(
  dirPath: string,
  options: FileOperationOptions = {},
): Promise<void> {
  try {
    const exists = await fileExists(dirPath);
    if (!exists) {
      console.log(`${LOG_PREFIX.warn} Directory not found: ${dirPath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`${LOG_PREFIX.dryRun} Would remove directory: ${dirPath}`);
      return;
    }

    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`${LOG_PREFIX.done} Removed directory: ${dirPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
  }
}

export async function removeFile(
  filePath: string,
  options: FileOperationOptions = {},
): Promise<void> {
  try {
    const exists = await fileExists(filePath);
    if (!exists) {
      console.log(`${LOG_PREFIX.warn} File not found: ${filePath}`);
      return;
    }

    if (options.dryRun) {
      console.log(`${LOG_PREFIX.dryRun} Would remove file: ${filePath}`);
      return;
    }

    await fs.unlink(filePath);
    console.log(`${LOG_PREFIX.done} Removed file: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
  }
}

export async function removeByPatterns(
  patterns: string[],
  cwd: string,
  options: FileOperationOptions = {},
): Promise<string[]> {
  const removed: string[] = [];

  try {
    const matches = await fg(patterns, {
      cwd,
      absolute: true,
      onlyFiles: false,
      dot: true,
    });

    for (const match of matches) {
      try {
        const stat = await fs.stat(match);

        if (stat.isDirectory()) {
          await removeDirectory(match, options);
        } else {
          await removeFile(match, options);
        }

        removed.push(match);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`${LOG_PREFIX.warn} Error processing ${match}: ${message}`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error resolving patterns: ${message}`);
  }

  return removed;
}

// ---------------------------------------------------------------------------
// File read / write helpers
// ---------------------------------------------------------------------------

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function writeFileContent(
  filePath: string,
  content: string,
  options: FileOperationOptions = {},
): Promise<void> {
  try {
    if (options.dryRun) {
      console.log(`${LOG_PREFIX.dryRun} Would write file: ${filePath}`);
      return;
    }

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    console.log(`${LOG_PREFIX.done} Wrote file: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Content modification
// ---------------------------------------------------------------------------

export async function replaceInFile(
  filePath: string,
  search: string | RegExp,
  replace: string,
  options: FileOperationOptions = {},
): Promise<boolean> {
  try {
    const content = await readFileContent(filePath);
    const updated = content.replace(search, replace);

    if (content === updated) {
      console.log(`${LOG_PREFIX.warn} No match for pattern in: ${filePath}`);
      return false;
    }

    if (options.dryRun) {
      console.log(`${LOG_PREFIX.dryRun} Would replace in: ${filePath}`);
      return true;
    }

    await fs.writeFile(filePath, updated, "utf-8");
    console.log(`${LOG_PREFIX.done} Replaced in: ${filePath}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
    return false;
  }
}

export async function removeLinesByPattern(
  filePath: string,
  pattern: RegExp,
  options: FileOperationOptions = {},
): Promise<number> {
  try {
    const content = await readFileContent(filePath);
    const lines = content.split("\n");
    const filtered = lines.filter((line) => !pattern.test(line));
    const removedCount = lines.length - filtered.length;

    if (removedCount === 0) {
      console.log(
        `${LOG_PREFIX.warn} No lines matching ${pattern} in: ${filePath}`,
      );
      return 0;
    }

    if (options.dryRun) {
      console.log(
        `${LOG_PREFIX.dryRun} Would remove ${removedCount} line(s) matching ${pattern} from: ${filePath}`,
      );
      return removedCount;
    }

    await fs.writeFile(filePath, filtered.join("\n"), "utf-8");
    console.log(
      `${LOG_PREFIX.done} Removed ${removedCount} line(s) matching ${pattern} from: ${filePath}`,
    );
    return removedCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// package.json helpers
// ---------------------------------------------------------------------------

export async function removeDependencyFromPackageJson(
  packageJsonPath: string,
  deps: string[],
  options: FileOperationOptions = {},
): Promise<void> {
  try {
    const content = await readFileContent(packageJsonPath);
    const pkg = JSON.parse(content) as Record<string, unknown>;
    let modified = false;

    const sections = ["dependencies", "devDependencies", "peerDependencies"] as const;

    for (const dep of deps) {
      let found = false;

      for (const section of sections) {
        const sectionObj = pkg[section] as Record<string, string> | undefined;
        if (sectionObj && dep in sectionObj) {
          found = true;
          if (!options.dryRun) {
            delete sectionObj[dep];
          }
          modified = true;
        }
      }

      if (found) {
        console.log(
          options.dryRun
            ? `${LOG_PREFIX.dryRun} Would remove dependency: ${dep}`
            : `${LOG_PREFIX.done} Removed dependency: ${dep}`,
        );
      } else {
        console.log(`${LOG_PREFIX.warn} Dependency not found: ${dep}`);
      }
    }

    if (modified && !options.dryRun) {
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(pkg, null, 2) + "\n",
        "utf-8",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
  }
}

export async function removeScriptFromPackageJson(
  packageJsonPath: string,
  scripts: string[],
  options: FileOperationOptions = {},
): Promise<void> {
  try {
    const content = await readFileContent(packageJsonPath);
    const pkg = JSON.parse(content) as Record<string, unknown>;
    const scriptsObj = pkg.scripts as Record<string, string> | undefined;
    let modified = false;

    if (!scriptsObj) {
      console.log(`${LOG_PREFIX.warn} No scripts section in: ${packageJsonPath}`);
      return;
    }

    for (const script of scripts) {
      if (script in scriptsObj) {
        if (!options.dryRun) {
          delete scriptsObj[script];
        }
        modified = true;
        console.log(
          options.dryRun
            ? `${LOG_PREFIX.dryRun} Would remove script: ${script}`
            : `${LOG_PREFIX.done} Removed script: ${script}`,
        );
      } else {
        console.log(`${LOG_PREFIX.warn} Script not found: ${script}`);
      }
    }

    if (modified && !options.dryRun) {
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(pkg, null, 2) + "\n",
        "utf-8",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${LOG_PREFIX.warn} Error: ${message}`);
  }
}
