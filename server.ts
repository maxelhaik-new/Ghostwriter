import http from "http";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import app from "./api/index";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const server = http.createServer(app);
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Visual Ghostwriter server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
