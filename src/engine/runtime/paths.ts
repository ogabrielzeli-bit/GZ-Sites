import path from 'node:path';

export const RUNTIME_SRC = path.join(import.meta.dirname, 'client', 'index.ts');
export const RUNTIME_DIST = path.join(import.meta.dirname, 'dist', 'gz-runtime.js');
