/**
 * 🏥 System Routes - Health Monitoring & System Status
 * Endpoints para monitoreo de salud del sistema FitnessPro V8
 * 
 * Proporciona información en tiempo real sobre:
 * - Estado de salud del sistema
 * - Métricas de rendimiento
 * - Conectividad de servicios
 * - Estadísticas de monitoreo
 */

import { Router, Request, Response } from 'express';
import { HealthMonitoringService } from '../services/healthMonitoringService';

const router = Router();
const healthService = HealthMonitoringService.getInstance();

/**
 * 🎯 GET /api/system/status
 * Endpoint principal de estado del sistema
 * Usado por el sistema de monitoreo interno y checks externos
 */
router.get('/api/system/status', (req: Request, res: Response) => {
  try {
    const currentHealth = healthService.getCurrentHealth();
    const metrics = healthService.getMetrics();
    
    const systemStatus = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Información de salud actual
      health: currentHealth ? {
        database: currentHealth.database,
        aiServices: currentHealth.aiServices,
        cache: currentHealth.cache,
        lastCheck: currentHealth.lastCheck,
        responseTime: currentHealth.responseTime
      } : 'initializing',
      
      // Métricas básicas
      metrics: {
        checksPerformed: metrics.checksPerformed,
        successRate: Math.round(metrics.successRate * 100),
        averageResponseTime: Math.round(metrics.averageResponseTime),
        monitoring: healthService.isMonitoringActive() ? 'active' : 'inactive'
      },
      
      // Información del sistema
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      }
    };

    // Headers para optimización
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-System-Check': 'health-monitoring'
    });

    res.json(systemStatus);
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error in /status endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'System status check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🏥 GET /api/system/health
 * Endpoint detallado de salud del sistema
 * Proporciona historial y métricas completas
 */
router.get('/api/system/health', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const currentHealth = healthService.getCurrentHealth();
    const healthHistory = healthService.getHealthHistory(limit);
    const metrics = healthService.getMetrics();

    const healthReport = {
      current: currentHealth,
      history: healthHistory.map(check => ({
        timestamp: check.lastCheck,
        database: check.database,
        aiServices: check.aiServices,
        cache: check.cache,
        responseTime: check.responseTime,
        uptime: check.uptime
      })),
      metrics: {
        ...metrics,
        successRatePercentage: Math.round(metrics.successRate * 100),
        systemLoadPercentage: Math.round(metrics.systemLoad * 100)
      },
      monitoring: {
        active: healthService.isMonitoringActive(),
        totalChecks: healthHistory.length,
        timeRange: healthHistory.length > 0 ? {
          from: healthHistory[0].lastCheck,
          to: healthHistory[healthHistory.length - 1].lastCheck
        } : null
      }
    };

    res.json(healthReport);
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error in /health endpoint:', error);
    res.status(500).json({
      error: 'Health report generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 📊 GET /api/system/metrics
 * Métricas detalladas del sistema
 * Para monitoreo avanzado y debugging
 */
router.get('/api/system/metrics', (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const systemMetrics = {
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: process.uptime(),
        formatted: formatUptime(process.uptime())
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
        unit: 'MB',
        heapUsagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        unit: 'microseconds'
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      healthMonitoring: healthService.getMetrics()
    };

    res.json(systemMetrics);
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error in /metrics endpoint:', error);
    res.status(500).json({
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🔄 GET /api/system/ping
 * Endpoint simple de conectividad
 * Para checks básicos de disponibilidad
 */
router.get('/api/system/ping', (req: Request, res: Response) => {
  const pingResponse = {
    pong: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    status: 'healthy'
  };

  res.json(pingResponse);
});

/**
 * 💓 GET /api/system/heartbeat
 * Endpoint de latido del sistema
 * Verificación rápida de servicios críticos
 */
router.get('/api/system/heartbeat', (req: Request, res: Response) => {
  try {
    const currentHealth = healthService.getCurrentHealth();
    
    const heartbeat = {
      alive: true,
      timestamp: new Date().toISOString(),
      services: {
        database: currentHealth?.database || 'unknown',
        aiServices: currentHealth?.aiServices || 'unknown',
        cache: currentHealth?.cache || 'unknown',
        monitoring: healthService.isMonitoringActive() ? 'active' : 'inactive'
      },
      uptime: process.uptime(),
      lastHealthCheck: currentHealth?.lastCheck || null
    };

    res.json(heartbeat);
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error in /heartbeat endpoint:', error);
    res.status(500).json({
      alive: false,
      error: 'Heartbeat check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🔧 POST /api/system/monitoring/restart
 * Reinicia el sistema de monitoreo
 * Solo para administradores o debugging
 */
router.post('/api/system/monitoring/restart', (req: Request, res: Response) => {
  try {
    // En un sistema real, aquí verificarías permisos de admin
    console.log('🔄 [SystemRoutes] Restarting health monitoring system...');
    
    healthService.restartMonitoring();
    
    res.json({
      success: true,
      message: 'Health monitoring system restarted',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error restarting monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart monitoring system',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 📈 GET /api/system/monitoring/stats
 * Estadísticas detalladas del sistema de monitoreo
 */
router.get('/api/system/monitoring/stats', (req: Request, res: Response) => {
  try {
    const metrics = healthService.getMetrics();
    const healthHistory = healthService.getHealthHistory(100);
    
    // Calcular estadísticas avanzadas
    const dbHealthStats = calculateServiceStats(healthHistory, 'database');
    const aiHealthStats = calculateServiceStats(healthHistory, 'aiServices');
    const cacheHealthStats = calculateServiceStats(healthHistory, 'cache');
    
    const monitoringStats = {
      overview: {
        totalChecks: metrics.checksPerformed,
        successRate: Math.round(metrics.successRate * 100),
        averageResponseTime: Math.round(metrics.averageResponseTime),
        systemLoad: Math.round(metrics.systemLoad * 100),
        lastFailure: metrics.lastFailure,
        monitoringActive: healthService.isMonitoringActive()
      },
      services: {
        database: dbHealthStats,
        aiServices: aiHealthStats,
        cache: cacheHealthStats
      },
      performance: {
        responseTimeDistribution: calculateResponseTimeDistribution(healthHistory),
        uptimePercentage: calculateUptimePercentage(healthHistory),
        healthTrend: calculateHealthTrend(healthHistory)
      },
      timestamp: new Date().toISOString()
    };

    res.json(monitoringStats);
    
  } catch (error) {
    console.error('❌ [SystemRoutes] Error in /monitoring/stats endpoint:', error);
    res.status(500).json({
      error: 'Monitoring stats generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// 🛠️ FUNCIONES AUXILIARES

/**
 * Formatea el uptime en formato legible
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

/**
 * Calcula estadísticas de un servicio específico
 */
function calculateServiceStats(history: any[], service: string) {
  if (history.length === 0) return { healthy: 0, degraded: 0, down: 0 };
  
  const stats = { healthy: 0, degraded: 0, down: 0, offline: 0, operational: 0, limited: 0, active: 0, warming: 0, cold: 0 };
  
  history.forEach(check => {
    const status = check[service];
    if (stats.hasOwnProperty(status)) {
      stats[status]++;
    }
  });
  
  return stats;
}

/**
 * Calcula distribución de tiempos de respuesta
 */
function calculateResponseTimeDistribution(history: any[]) {
  if (history.length === 0) return { fast: 0, normal: 0, slow: 0 };
  
  const distribution = { fast: 0, normal: 0, slow: 0 };
  
  history.forEach(check => {
    if (check.responseTime < 1000) distribution.fast++;
    else if (check.responseTime < 3000) distribution.normal++;
    else distribution.slow++;
  });
  
  return distribution;
}

/**
 * Calcula porcentaje de uptime
 */
function calculateUptimePercentage(history: any[]): number {
  if (history.length === 0) return 100;
  
  const healthyChecks = history.filter(check => 
    check.database === 'healthy' && 
    check.aiServices === 'operational' && 
    check.cache === 'active'
  ).length;
  
  return Math.round((healthyChecks / history.length) * 100);
}

/**
 * Calcula tendencia de salud
 */
function calculateHealthTrend(history: any[]): string {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(-10);
  const older = history.slice(-20, -10);
  
  if (recent.length === 0 || older.length === 0) return 'stable';
  
  const recentHealth = recent.filter(check => check.database === 'healthy').length / recent.length;
  const olderHealth = older.filter(check => check.database === 'healthy').length / older.length;
  
  if (recentHealth > olderHealth + 0.1) return 'improving';
  if (recentHealth < olderHealth - 0.1) return 'degrading';
  return 'stable';
}

export default router;
