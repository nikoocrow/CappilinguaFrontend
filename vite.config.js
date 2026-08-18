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
  },
};
