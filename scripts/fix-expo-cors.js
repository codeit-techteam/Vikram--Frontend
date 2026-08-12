/**
 * Expo CorsMiddleware rejects Cursor/VS Code Simple Browser
 * (Origin: vscode-file://vscode-app). Patch the allow-list so
 * embedded previews and source-map requests don't crash Metro.
 *
 * Safe to run repeatedly.
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(
    __dirname,
    '..',
    'node_modules',
    'expo',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'middleware',
    'CorsMiddleware.js',
  ),
  path.join(
    __dirname,
    '..',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'middleware',
    'CorsMiddleware.js',
  ),
];

const NEEDLE = "const DEFAULT_ALLOWED_CORS_HOSTS = [\n    'devtools'\n];";
const REPLACEMENT = `const DEFAULT_ALLOWED_CORS_HOSTS = [
    'devtools',
    // Cursor / VS Code Simple Browser & embedded webviews
    'vscode-app',
];`;

let patched = 0;
for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  if (original.includes("'vscode-app'")) {
    console.log(`[fix-expo-cors] already patched: ${file}`);
    patched += 1;
    continue;
  }
  if (!original.includes(NEEDLE)) {
    console.warn(
      `[fix-expo-cors] unexpected CorsMiddleware format, skip: ${file}`,
    );
    continue;
  }
  fs.writeFileSync(file, original.replace(NEEDLE, REPLACEMENT));
  console.log(`[fix-expo-cors] patched: ${file}`);
  patched += 1;
}

if (patched === 0) {
  console.warn('[fix-expo-cors] CorsMiddleware.js not found — skip');
  process.exit(0);
}
