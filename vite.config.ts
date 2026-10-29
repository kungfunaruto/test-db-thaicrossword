import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { gtranslate, validTexts } from './api/_gtranslate';

// Dev only: serves POST /api/translate like the Vercel function (without the admin check), so translation can be tried locally.
const devTranslate = (): Plugin => ({
  name: 'dev-translate-api',
  configureServer(server) {
    server.middlewares.use('/api/translate', (req, res) => {
      let raw = '';
      req.on('data', c => { raw += c; });
      req.on('end', async () => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const texts = validTexts(JSON.parse(raw || '{}'));
          if (!texts) { res.statusCode = 400; res.end('{"error":"bad request"}'); return; }
          const translations: string[] = [];
          for (const t of texts) translations.push(await gtranslate(t));
          res.end(JSON.stringify({ translations }));
        } catch (e) { res.statusCode = 502; res.end(JSON.stringify({ error: String(e) })); }
      });
    });
  },
});

export default defineConfig({
  plugins: [react(), devTranslate()],
  build: {
    rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], supabase: ['@supabase/supabase-js'] } } },
  },
});
