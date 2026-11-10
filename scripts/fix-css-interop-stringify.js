/**
 * NativeWind / react-native-css-interop DEV bug:
 * printUpgradeWarning → stringify uses Object.entries, which invokes getters.
 * React Navigation / Expo Router context defaults throw ("Couldn't find a
 * LinkingContext context") when those getters run — crashing render in DEV.
 *
 * https://github.com/nativewind/nativewind/issues/1812
 *
 * Safe to run repeatedly.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'render-component.js',
);

const MARKER = '/* vikram-safe-stringify */';

const SAFE_STRINGIFY = `${MARKER}
function stringify(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, function replace(_, value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const newValue = Array.isArray(value) ? [] : {};
        let keys;
        try {
            keys = Object.keys(value);
        } catch {
            seen.delete(value);
            return "[Unserializable]";
        }
        for (const key of keys) {
            try {
                newValue[key] = replace(key, value[key]);
            } catch {
                newValue[key] = "[Throws]";
            }
        }
        seen.delete(value);
        return newValue;
    }, 2);
}`;

try {
  if (!fs.existsSync(target)) {
    console.warn('[fix-css-interop-stringify] file not found, skip');
    process.exit(0);
  }

  let source = fs.readFileSync(target, 'utf8');
  if (source.includes(MARKER)) {
    process.exit(0);
  }

  const unsafe =
    /function stringify\(object\) \{\n    const seen = new WeakSet\(\);\n    return JSON\.stringify\(object, function replace\(_, value\) \{\n        if \(!\(value !== null && typeof value === "object"\)\) \{\n            return value;\n        \}\n        if \(seen\.has\(value\)\) \{\n            return "\[Circular\]";\n        \}\n        seen\.add\(value\);\n        const newValue = Array\.isArray\(value\) \? \[\] : \{\};\n        for \(const entry of Object\.entries\(value\)\) \{\n            newValue\[entry\[0\]\] = replace\(entry\[0\], entry\[1\]\);\n        \}\n        seen\.delete\(value\);\n        return newValue;\n    \}, 2\);\n\}/;

  if (!unsafe.test(source)) {
    console.warn(
      '[fix-css-interop-stringify] unexpected source shape, skip (nativewind may have fixed this)',
    );
    process.exit(0);
  }

  source = source.replace(unsafe, SAFE_STRINGIFY);
  fs.writeFileSync(target, source);
  console.log('[fix-css-interop-stringify] patched react-native-css-interop stringify');
} catch (error) {
  console.warn(
    '[fix-css-interop-stringify] failed:',
    error instanceof Error ? error.message : error,
  );
}
