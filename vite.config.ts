import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { apiHandlers } from './src/server/printApi.ts';

/**
 * Deterministic print-toolkit API middleware.
 *
 * Every route under /api/print/* returns JSON computed by the same pure
 * engines used in the browser. There is no external AI/LLM dependency.
 *
 * Routing guarantees:
 *  - Only /api/print/* is intercepted; everything else falls through to Vite.
 *  - Responses always set Content-Type: application/json so the frontend
 *    receives JSON, never the SPA's <!doctype html>.
 *  - Errors are returned as JSON with a proper status code and message.
 */
function printApiPlugin(): Plugin {
  const routes: Record<string, (body: any) => unknown> = {
    doctor: apiHandlers.doctor,
    preflight: apiHandlers.preflight,
    'cost-estimate': apiHandlers.cost,
    'color-advice': apiHandlers.color,
    poster: apiHandlers.poster,
  };

  return {
    name: 'print-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/print/')) {
          return next();
        }

        const endpoint = req.url.replace('/api/print/', '').split('?')[0];
        res.setHeader('Content-Type', 'application/json');

        const handler = routes[endpoint];
        if (!handler) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Unknown endpoint "${endpoint}".` }));
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Use POST for this endpoint.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
          if (body.length > 5 * 1024 * 1024) {
            res.statusCode = 413;
            res.end(JSON.stringify({ error: 'Request body too large (max 5 MB).' }));
            req.destroy();
          }
        });

        req.on('end', () => {
          if (res.writableEnded) return;
          try {
            const parsed = body ? JSON.parse(body) : {};
            const data = handler(parsed);
            res.statusCode = 200;
            res.end(JSON.stringify({ data }));
          } catch (err: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err?.message || 'Invalid request.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), printApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
