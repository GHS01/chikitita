import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { workoutCronService } from "./services/workoutCronService";
import { schedulerService } from "./services/schedulerService";
import { HealthMonitoringService } from "./services/healthMonitoringService";
import systemRoutes from "./routes/systemRoutes";

const app = express();

// 🚀 CONFIGURACIÓN MEJORADA PARA ARCHIVOS GRANDES
app.use(express.json({
  limit: '10mb' // ✅ Aumentar límite para imágenes base64
}));
app.use(express.urlencoded({
  extended: false,
  limit: '10mb' // ✅ Aumentar límite para form data
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
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
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 🏥 SISTEMA DE MONITOREO DE SALUD
  // Integrar rutas del sistema para monitoreo de salud y métricas
  app.use(systemRoutes);

  // Inicializar servicio de monitoreo de salud
  const healthMonitoring = HealthMonitoringService.getInstance();
  console.log('🏥 [Server] Health monitoring system initialized');

  // 🧪 ENDPOINT DE PRUEBA PARA CRON JOBS (SOLO DESARROLLO)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-cron', async (req, res) => {
      try {
        console.log('🧪 [Test] Manual cron job execution triggered...');
        await workoutCronService.nightlyWorkoutGeneration();
        res.json({ success: true, message: 'Cron job executed successfully' });
      } catch (error) {
        console.error('❌ [Test] Error in manual cron execution:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/test-daily-report', async (req, res) => {
      try {
        console.log('🧪 [Test] Manual daily report triggered...');
        await workoutCronService.dailyReport();
        res.json({ success: true, message: 'Daily report executed successfully' });
      } catch (error) {
        console.error('❌ [Test] Error in daily report:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  const server = await registerRoutes(app);

  // 🤖 Inicializar sistema de cron jobs para auto-generación de rutinas
  console.log('⏰ [Server] Initializing workout cron jobs...');
  workoutCronService.initializeCronJobs();
  console.log('✅ [Server] Workout cron jobs initialized successfully');

  // 🧪 ENDPOINT DE PRUEBA PARA CRON JOBS (SOLO DESARROLLO)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/test-cron', async (req: Request, res: Response) => {
      try {
        console.log('🧪 [Test] Manual cron job execution triggered...');
        await workoutCronService.nightlyWorkoutGeneration();
        res.json({ success: true, message: 'Cron job executed successfully' });
      } catch (error) {
        console.error('❌ [Test] Error in manual cron execution:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  // 📊 Inicializar scheduler de reportes automáticos
  console.log('📊 [Server] Initializing automatic reports scheduler...');
  try {
    await schedulerService.initialize();
    schedulerService.start();
    console.log('✅ [Server] Automatic reports scheduler initialized and started successfully');
  } catch (error) {
    console.error('❌ [Server] Error initializing scheduler:', error);
  }

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`❌ Error in ${req.method} ${req.path}:`, err);
    res.status(status).json({ message });
    // ✅ NO throw err - esto crashea el servidor
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = (process.env.NODE_ENV || "").trim();
  const isDevelopment = nodeEnv === "development" || !nodeEnv;
  console.log(`Environment: "${nodeEnv}", isDevelopment: ${isDevelopment}`);

  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5002
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;

  // 🧪 ENDPOINTS DE PRUEBA FINALES (SOLO DESARROLLO)
  if (isDevelopment) {
    app.get('/api/test-system', async (req, res) => {
      try {
        console.log('🧪 [Test] System test triggered...');

        // Probar WorkoutCronService
        console.log('🧪 [Test] Testing WorkoutCronService...');
        await workoutCronService.dailyReport();

        res.json({
          success: true,
          message: 'System test completed successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ [Test] Error in system test:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    app.get('/api/test-workout-generation', async (req, res) => {
      try {
        console.log('🧪 [Test] Workout generation test triggered...');

        // Probar generación nocturna
        console.log('🧪 [Test] Testing nightly workout generation...');
        await workoutCronService.nightlyWorkoutGeneration();

        res.json({
          success: true,
          message: 'Workout generation test completed successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ [Test] Error in workout generation test:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // 🔧 FIX: Removed reusePort to fix ENOTSUP error
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}`);
    log(`📱 Frontend: http://localhost:5173`);
    log(`🔌 API: http://localhost:${port}/api`);

    if (isDevelopment) {
      log(`🧪 Test endpoint: http://localhost:${port}/api/test-system`);
    }
  });
})();
