import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  handlePrintDoctor,
  handlePosterGenerator,
  handleCardGenerator,
  handleResumeBuilder,
  handleImageEnhancer,
  handleCostEstimator,
  handleColorAdvisor,
  handlePreflightCheck,
} from './src/server/geminiApi.ts';

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        const endpoint = req.url.replace('/api/gemini/', '').split('?')[0];
        let body = '';

        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            res.setHeader('Content-Type', 'application/json');

            if (endpoint === 'doctor') {
              const data = await handlePrintDoctor(parsedBody.issueDescription, parsedBody.printType, parsedBody.paperType);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'poster') {
              const data = await handlePosterGenerator(parsedBody.prompt, parsedBody.category, parsedBody.colorScheme, parsedBody.dimensions);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'card') {
              const data = await handleCardGenerator(parsedBody.cardDetails || parsedBody);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'resume') {
              const data = await handleResumeBuilder(parsedBody.resumeData || parsedBody);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'enhance') {
              const data = await handleImageEnhancer(parsedBody);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'cost-estimate') {
              const data = await handleCostEstimator(parsedBody);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'color-advice') {
              const data = await handleColorAdvisor(parsedBody);
              res.end(JSON.stringify(data));
            } else if (endpoint === 'preflight') {
              const data = await handlePreflightCheck(parsedBody);
              res.end(JSON.stringify(data));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
          } catch (err: any) {
            console.error('API Middleware Error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
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
