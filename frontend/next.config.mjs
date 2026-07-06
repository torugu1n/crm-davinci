import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  // Ignora outputFileTracingRoot na Vercel para evitar erros de build (lstat routes-manifest)
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: __dirname }),
};

export default nextConfig;
