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

  // Proxy endpoint to bypass CORS and Mixed-Content for M3U playlists, EPG, and HLS segments
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

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      const isM3u8 = contentType.includes('mpegurl') || 
                     contentType.includes('application/vnd.apple.mpegurl') || 
                     contentType.includes('application/x-mpegurl') ||
                     targetUrl.toLowerCase().includes('.m3u8');

      if (isM3u8) {
        const text = await response.text();
        if (text.trim().startsWith('#EXTM3U') || text.includes('#EXTINF') || text.includes('#EXT-X-')) {
          // Rewrite manifest lines so every segment & sub-manifest flows through /api/proxy
          const baseUrl = new URL(targetUrl);
          const rewrittenLines = text.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            // Rewrite EXT-X-KEY or EXT-X-MAP URI="url"
            if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
              return trimmed.replace(/URI=["']([^"']+)["']/g, (_, uri) => {
                try {
                  const absUri = new URL(uri, baseUrl).toString();
                  return `URI="/api/proxy?url=${encodeURIComponent(absUri)}"`;
                } catch {
                  return `URI="${uri}"`;
                }
              });
            }

            // Other comment or tag lines
            if (trimmed.startsWith('#')) {
              return line;
            }

            // Chunk / Segment / Sub-playlist URL
            try {
              const absUrl = new URL(trimmed, baseUrl).toString();
              return `/api/proxy?url=${encodeURIComponent(absUrl)}`;
            } catch {
              return line;
            }
          });

          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          return res.send(rewrittenLines.join('\n'));
        }
        res.setHeader('Content-Type', contentType);
        return res.send(text);
      }

      res.setHeader('Content-Type', contentType);
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Failed to proxy request', message: err?.message });
    }
  });

  // Fast diagnostic check for any stream URL
  app.get('/api/stream-check', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IPTVPlayerPro/2.0',
          'Range': 'bytes=0-2048',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';

      return res.json({
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        contentType,
        latencyMs,
        is404: response.status === 404,
        is403: response.status === 403,
      });
    } catch (err: any) {
      return res.json({
        status: 0,
        ok: false,
        statusText: err?.name === 'AbortError' ? 'Timeout (6s)' : (err?.message || 'Network unreachable'),
        latencyMs: Date.now() - startTime,
        is404: false,
        is403: false,
      });
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

  // Serve public static assets (manifest, icons, images)
  app.use(express.static(path.join(process.cwd(), 'public')));

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
