import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore - ES module import for local dev server
import stockHandler from './api/stock.js';

function stockApiDevPlugin(): Plugin {
  return {
    name: 'stock-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/stock')) {
          return next();
        }
        try {
          await stockHandler(req, res);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Dev server error' }));
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), stockApiDevPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
