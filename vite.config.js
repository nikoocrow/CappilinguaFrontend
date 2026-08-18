import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  root: 'src/', // Archivos fuente (donde vive index.html)
  publicDir: '../static/', // Assets servidos tal cual, relativo a "root"
  server: {
    host: true,
  },
  build: {
    outDir: '../dist', // Salida del build
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Multi-page: juego (index.html) + personalización de personaje (customize.html)
      input: {
        main: resolve(__dirname, 'src/index.html'),
        customize: resolve(__dirname, 'src/customize.html'),
      },
    },
  },
};
