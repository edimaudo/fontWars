import { defineConfig } from 'vite';
import { iwsdkDev } from '@iwsdk/vite-plugin-dev';

export default defineConfig({
  plugins: [iwsdkDev()],
  server: {
    host: '0.0.0.0',
    open: false,
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    target: 'es2022',
  },
});
