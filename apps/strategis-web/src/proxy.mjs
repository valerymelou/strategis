import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// proxy.mjs is placed at the root of dist/apps/strategis-web/
// Each locale is built under dist/apps/strategis-web/<locale>/browser/
const DIST_ROOT = process.env['DIST_ROOT'] ?? __dirname;

const server = express();
const port = Number(process.env['PORT']) || 4000;
const host = process.env['HOST'] || '0.0.0.0';

server.use(cookieParser());

const isProduction = !!process.env['ENV_ENVIRONMENT'];

server.disable('x-powered-by');
server.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  if (isProduction) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }
  next();
});

// Locale detection: cookie only, default to fr
function detectLocale(req) {
  const cookieLang = req.cookies['strategis-language-override'];
  if (cookieLang === 'en') return 'en';
  return 'fr';
}

// Health check
server.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Static assets — serve from both locale folders (hashed filenames prevent collisions)
server.use(
  express.static(join(DIST_ROOT, 'en', 'browser'), {
    maxAge: '1y',
    index: false,
  }),
);
server.use(
  express.static(join(DIST_ROOT, 'fr', 'browser'), {
    maxAge: '1y',
    index: false,
  }),
);

// SPA fallback — serve the locale-specific index.html for all remaining routes
server.get('*', (req, res) => {
  const locale = detectLocale(req);
  res.setHeader('Vary', 'Cookie');
  res.setHeader('Content-Language', locale);
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(join(DIST_ROOT, locale, 'browser', 'index.html'));
});

// Start server
server.listen(port, host, () => {
  console.log(`Node Express server listening on http://${host}:${port}`);
});
