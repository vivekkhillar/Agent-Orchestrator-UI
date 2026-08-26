import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FASTAPI_URL = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log(`[Reverse Proxy Configured] Routing all /api/* requests to FastAPI at: ${FASTAPI_URL}`);

// ====================================================================
// PURE REVERSE PROXY: ALL API CALLS FORWARDED DIRECTLY TO FASTAPI
// Express does NOT query the database or LLM directly.
// The Python FastAPI Orchestrator on port 8000 handles all business logic.
// ====================================================================

app.all('/api/*', async (req, res) => {
  const targetUrl = `${FASTAPI_URL}${req.originalUrl}`;
  try {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key !== 'host' && key !== 'content-length' && typeof value === 'string') {
        headers[key] = value;
      }
    }
    if (!headers['content-type'] && (req.method === 'POST' || req.method === 'PUT')) {
      headers['content-type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    res.status(response.status);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (err: any) {
    console.error(`[Proxy Error] Failed to reach FastAPI backend at ${targetUrl}:`, err.message);
    return res.status(503).json({
      success: false,
      status: 'FASTAPI_BACKEND_OFFLINE',
      error: 'FastAPI Backend Offline',
      message: `Could not connect to FastAPI Orchestrator at ${FASTAPI_URL}. Please ensure 'python fastapi_app.py' or 'python start_all.py' is running on port 8000.`,
      diagnostics: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Setup Vite middleware in dev mode or static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LangGraph Multi-Agent Banking Harness UI running on http://0.0.0.0:${PORT}`);
    console.log(`API requests transparently proxied to FastAPI Orchestrator at ${FASTAPI_URL}`);
  });
}

start();
