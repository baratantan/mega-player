import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Proxy endpoint to bypass CORS for M3U playlist URLs or EPG XML
  app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IPTVPlayerPro/2.0',
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch target URL: ${response.statusText}`,
          statusCode: response.status,
        });
      }

      // Pass content type
      const contentType = response.headers.get('content-type') || 'text/plain';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');

      const data = await response.text();
      res.send(data);
    } catch (err: any) {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Failed to proxy request', message: err?.message });
    }
  });

  // Xtream Codes API Proxy to bypass CORS
  app.get('/api/xtream', async (req, res) => {
    const { server, username, password, action, ...otherParams } = req.query;
    if (!server || !username || !password) {
      return res.status(400).json({ error: 'server, username, and password are required' });
    }

    try {
      let cleanServer = (server as string).trim();
      if (!cleanServer.startsWith('http://') && !cleanServer.startsWith('https://')) {
        cleanServer = 'http://' + cleanServer;
      }
      if (cleanServer.endsWith('/')) {
        cleanServer = cleanServer.slice(0, -1);
      }

      const queryParams = new URLSearchParams();
      queryParams.append('username', username as string);
      queryParams.append('password', password as string);
      if (action) {
        queryParams.append('action', action as string);
      }
      for (const [key, value] of Object.entries(otherParams)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }

      const xtreamUrl = `${cleanServer}/player_api.php?${queryParams.toString()}`;

      const response = await fetch(xtreamUrl, {
        headers: {
          'User-Agent': 'IPTVSmartersPro/3.0.0 (Linux; Android 12)',
          'Accept': 'application/json, text/plain, */*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Xtream API error', status: response.status });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Xtream proxy error:', err);
      res.status(500).json({ error: 'Failed to connect to Xtream Codes server', message: err?.message });
    }
  });

  // Vite middleware for development vs static build in production
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
    console.log(`IPTV Player Pro server running on http://localhost:${PORT}`);
  });
}

startServer();
