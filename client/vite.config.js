import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vercel-api-dev-server',
      configureServer(server) {
        // Load local .env file from project root into process.env
        const envPath = path.resolve(process.cwd(), '../.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          envContent.split(/\r?\n/).forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
              const key = match[1];
              let value = match[2] || '';
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              } else if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
              }
              process.env[key] = value.replace(/\\n/g, '\n');
            }
          });
        }

        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url, 'http://localhost');
          
          if (url.pathname === '/api/approve-device' || url.pathname === '/api/student-login') {
            try {
              // Parse body
              let body = '';
              req.on('data', chunk => { body += chunk; });
              await new Promise((resolve) => req.on('end', resolve));
              
              if (body) {
                try {
                  req.body = JSON.parse(body);
                } catch (e) {
                  req.body = {};
                }
              }
              
              // Add helpers to res
              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return res;
              };
              
              // Load handler using absolute path converted to file URL
              const relativePath = url.pathname === '/api/approve-device' 
                ? '../api/approve-device.js' 
                : '../api/student-login.js';
              const absolutePath = path.resolve(process.cwd(), relativePath);
              
              const { default: handler } = await import(pathToFileURL(absolutePath).href);
              await handler(req, res);
            } catch (err) {
              console.error("Vite Local API Proxy Error:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
})
