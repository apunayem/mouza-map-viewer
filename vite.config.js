import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const PYTHON_PATH = "C:\\Program Files\\ArcGIS\\Pro\\bin\\Python\\envs\\arcgispro-py3\\python.exe";

// Vite plugin to handle on-demand Mouza GeoJSON extraction & PMTiles Range Requests
function mouzaVectorPlugin() {
  return {
    name: 'mouza-vector-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // 1. On-demand Mouza GeoJSON extraction API: /api/mouza-plots?upazila=...&jl=...
        if (pathname === '/api/mouza-plots') {
          const upazila = urlObj.searchParams.get('upazila');
          const jl = urlObj.searchParams.get('jl');

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (!upazila || !jl) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: "Missing 'upazila' or 'jl' parameter" }));
          }

          const cacheDir = path.join(process.cwd(), 'public', 'data', 'cache_mouzas');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const jlPadded = jl.padStart(3, '0');
          const cacheFile1 = path.join(cacheDir, `${upazila}_${jl}.geojson`);
          const cacheFile2 = path.join(cacheDir, `${upazila}_${jlPadded}.geojson`);
          
          let targetFile = fs.existsSync(cacheFile1) ? cacheFile1 : (fs.existsSync(cacheFile2) ? cacheFile2 : null);

          if (!targetFile) {
            try {
              console.log(`[API] Extracting on-demand plots for Upazila: '${upazila}', JL: '${jl}'...`);
              execFileSync(PYTHON_PATH, [
                path.join(process.cwd(), 'scripts', 'extract_single_mouza.py'),
                '--upazila', upazila,
                '--jl', jl
              ], { encoding: 'utf-8', timeout: 60000 });

              targetFile = fs.existsSync(cacheFile1) ? cacheFile1 : (fs.existsSync(cacheFile2) ? cacheFile2 : null);
            } catch (err) {
              console.error('[API] Error extracting mouza:', err.message);
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: "Failed to extract mouza", details: err.message }));
            }
          }

          if (targetFile && fs.existsSync(targetFile)) {
            const content = fs.readFileSync(targetFile, 'utf-8');
            res.statusCode = 200;
            return res.end(content);
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: `Mouza JL ${jl} not found in ${upazila}` }));
          }
        }

        // 2. PMTiles Range Requests Handler
        if (pathname.endsWith('.pmtiles')) {
          const filePath = path.join(process.cwd(), 'public', pathname.replace(/^\//, ''));
          
          if (!fs.existsSync(filePath)) {
            return next();
          }

          const stat = fs.statSync(filePath);
          const fileSize = stat.size;
          const range = req.headers.range;

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Type', 'application/vnd.pmtiles');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
              res.statusCode = 416;
              res.setHeader('Content-Range', `bytes */${fileSize}`);
              return res.end();
            }

            const chunkSize = (end - start) + 1;
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Content-Length', chunkSize);

            const fileStream = fs.createReadStream(filePath, { start, end });
            fileStream.pipe(res);
            return;
          } else {
            res.statusCode = 200;
            res.setHeader('Content-Length', fileSize);
            if (req.method === 'HEAD') {
              return res.end();
            }
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            return;
          }
        }

        next();
      });
    }
  };
}

function selectivePublicCopyPlugin() {
  return {
    name: 'selective-public-copy',
    closeBundle() {
      const distDir = path.join(process.cwd(), 'dist');
      const distData = path.join(distDir, 'data');
      if (!fs.existsSync(distData)) {
        fs.mkdirSync(distData, { recursive: true });
      }

      const filesToCopy = [
        ['public/_headers', 'dist/_headers'],
        ['public/data/upazila_mouzas.json', 'dist/data/upazila_mouzas.json'],
        ['public/data/mouzas.json', 'dist/data/mouzas.json']
      ];

      for (const [srcRel, destRel] of filesToCopy) {
        const srcPath = path.join(process.cwd(), srcRel);
        const destPath = path.join(process.cwd(), destRel);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // If user explicitly asks to bundle all mouzas into dist (e.g. for offline use)
      if (process.env.VITE_INCLUDE_ALL_MOUZAS === 'true') {
        const srcMouzas = path.join(process.cwd(), 'public', 'data', 'mouzas');
        const destMouzas = path.join(distData, 'mouzas');
        if (fs.existsSync(srcMouzas) && !fs.existsSync(destMouzas)) {
          console.log('[Build] Copying full public/data/mouzas to dist/ (this may take time)...');
          fs.cpSync(srcMouzas, destMouzas, { recursive: true });
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [mouzaVectorPlugin(), selectivePublicCopyPlugin()],
  build: {
    copyPublicDir: false,
    outDir: 'dist'
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Accept-Ranges': 'bytes'
    }
  },
  preview: {
    port: 5173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes'
    }
  }
});
