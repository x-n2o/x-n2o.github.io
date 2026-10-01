import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://x-n2o.net',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
