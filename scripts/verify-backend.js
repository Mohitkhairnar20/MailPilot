const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const backendSrcDir = path.join(__dirname, "..", "backend", "src");

function collectJavaScriptFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(fullPath);
    }

    return entry.isFile() && fullPath.endsWith(".js") ? [fullPath] : [];
  });
}

function verifyFile(filePath) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    stdio: "pipe",
    encoding: "utf8"
  });

  if (result.status !== 0) {
    const errorOutput = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`Syntax check failed for ${filePath}\n${errorOutput}`.trim());
  }
}

function main() {
  if (!fs.existsSync(backendSrcDir)) {
    throw new Error(`Backend source directory not found: ${backendSrcDir}`);
  }

  const files = collectJavaScriptFiles(backendSrcDir);

  if (files.length === 0) {
    throw new Error("No backend JavaScript files were found to validate.");
  }

  files.forEach(verifyFile);
  console.log(`Verified backend syntax for ${files.length} files.`);
}

main();
