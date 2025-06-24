import "./start";

import express, { type Request, Response, NextFunction } from "express";
import { initDb } from './db'; // 👉 initialise la base avant tout
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// ⚠️ Initialiser la base de données AVANT d’importer des modules qui utilisent getDb()
initDb();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware de logging des requêtes API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Middleware gestion erreurs
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      // Ne pas throw ici pour éviter crash serveur
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Erreur au démarrage du serveur:", error);
    process.exit(1);
  }
})();
