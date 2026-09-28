import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{'pdf-renderer':['pdfjs-dist'],'pdf-editor':['pdf-lib']}}}}});
