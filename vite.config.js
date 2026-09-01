import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import react from '@vitejs/plugin-react';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  root: 'src/', // Archivos fuente (donde vive index.html)
  publicDir: '../static/', // Assets servidos tal cual, relativo a "root"
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    outDir: '../dist', // Salida del build
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Multi-page: app React (index.html) + el juego y la personalización
      // vanilla como páginas sueltas, útiles para depurar el 3D sin el shell.
      input: {
        main: resolve(__dirname, 'src/index.html'),
        game: resolve(__dirname, 'src/game.html'),
        customize: resolve(__dirname, 'src/customize.html'),
      },
    },
  },
};
