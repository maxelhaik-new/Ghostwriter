const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace middlewareMode
code = code.replace(
  'server: { middlewareMode: true },',
  'server: { middlewareMode: true, hmr: { server } },'
);

// Add server creation
code = code.replace(
  'async function startServer() {',
  'async function startServer() {\n  const server = http.createServer(app);'
);

// Replace app.listen
code = code.replace(
  'app.listen(PORT',
  'server.listen(PORT'
);

fs.writeFileSync('server.ts', code);
