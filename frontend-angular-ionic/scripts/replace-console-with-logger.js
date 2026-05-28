// scripts/replace-console-with-logger.js
const { promises: fs } = require('fs');
const path = require('path');
const glob = require('glob');

// Root folder for UI pages/components (features and shared components)
const ROOT = path.resolve(__dirname, '..', 'src', 'app');
const PATTERN = '**/*.ts';

// Helper to compute relative import path to LoggerService
function getImportPath(filePath) {
  const loggerAbs = path.resolve(__dirname, '..', 'src', 'app', 'core', 'services', 'system', 'logger.service.ts');
  const dir = path.dirname(filePath);
  let rel = path.relative(dir, loggerAbs);
  // Remove the .ts extension for import statements
  rel = rel.replace(/\.ts$/, '');
  // Convert Windows backslashes to POSIX style for imports
  rel = rel.split(path.sep).join('/');
  // Ensure a leading './' if needed
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

async function processFile(file) {
  let content = await fs.readFile(file, 'utf8');

  // Only target UI pages (under features or shared components)
  if (!/\/features\//.test(file) && !/\/shared\//.test(file)) return;
  if (!/console\.(log|warn|error|info)\s*\(/.test(content)) return;

  // ---------------------------------------------------
  // 1️⃣ Insert LoggerService import if it does not exist
  // ---------------------------------------------------
  const importPath = getImportPath(file);
  const importStmt = `import { LoggerService } from '${importPath}';`;
  if (!content.includes(importStmt)) {
    // Find last import line and insert after it
    const lastImportIdx = content.lastIndexOf('import');
    const afterLastImport = content.indexOf('\n', lastImportIdx);
    content = content.slice(0, afterLastImport + 1) + importStmt + '\n' + content.slice(afterLastImport + 1);
  }

  // ---------------------------------------------------
  // 2️⃣ Inject logger into the class if missing
  // ---------------------------------------------------
  const classMatch = content.match(/export\s+class\s+\w+\s+.*?\{([\s\S]*?)\n\}/);
  if (classMatch) {
    const classBody = classMatch[1];
    if (!/private\s+readonly\s+logger\s*=/.test(classBody)) {
      // Locate the last existing `inject` line inside the class (usually after other services)
      const injectLines = classBody.match(/private\s+readonly\s+\w+\s*=\s*inject\([^\)]+\);/g) || [];
      const lastInject = injectLines[injectLines.length - 1];
      if (lastInject) {
        const injectIdx = content.indexOf(lastInject) + lastInject.length;
        const loggerInject = '\n  private readonly logger = inject(LoggerService);';
        content = content.slice(0, injectIdx) + loggerInject + content.slice(injectIdx);
      } else {
        // Fallback: add right after the opening brace of the class
        const openingBraceIdx = content.indexOf('{', content.indexOf('export class'));
        content = content.slice(0, openingBraceIdx + 1) + '\n  private readonly logger = inject(LoggerService);' + content.slice(openingBraceIdx + 1);
      }
    }
  }

  // ---------------------------------------------------
  // 3️⃣ Replace all console calls with logger calls
  // ---------------------------------------------------
  content = content.replace(/console\.log\s*\(/g, 'this.logger.log(');
  content = content.replace(/console\.warn\s*\(/g, 'this.logger.warn(');
  content = content.replace(/console\.error\s*\(/g, 'this.logger.error(');
  content = content.replace(/console\.info\s*\(/g, 'this.logger.info(');

  await fs.writeFile(file, content, 'utf8');
  console.log('✔ Updated', path.relative(ROOT, file));
}

glob(path.join(ROOT, PATTERN), async (err, files) => {
  if (err) throw err;
  for (const file of files) {
    await processFile(file);
  }
  console.log('✅ All console statements replaced with LoggerService.');
});
