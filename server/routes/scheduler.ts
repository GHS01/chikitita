import express from 'express';
import { schedulerService } from '../services/schedulerService';

const router = express.Router();

/**
 * 🚀 POST /api/scheduler/start
 * Iniciar el scheduler de reportes automáticos
 */
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 [API] Starting scheduler');

    schedulerService.start();

    res.json({
      success: true,
      message: 'Scheduler iniciado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🛑 POST /api/scheduler/stop
 * Detener el scheduler de reportes automáticos
 */
router.post('/stop', async (req, res) => {
  try {
    console.log('🛑 [API] Stopping scheduler');

    schedulerService.stop();

    res.json({
      success: true,
      message: 'Scheduler detenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/scheduler/stats
 * Obtener estadísticas del scheduler
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 [API] Getting scheduler stats');

    const stats = schedulerService.getStats();

    res.json({
      success: true,
      stats,
      message: 'Estadísticas del scheduler obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting scheduler stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔄 POST /api/scheduler/initialize
 * Inicializar scheduler con tareas predeterminadas
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🔄 [API] Initializing scheduler');

    await schedulerService.initialize();

    res.json({
      success: true,
      message: 'Scheduler inicializado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error initializing scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📅 POST /api/scheduler/schedule-weekly
 * Programar reportes semanales para todos los usuarios
 */
router.post('/schedule-weekly', async (req, res) => {
  try {
    console.log('📅 [API] Scheduling weekly reports');

    await schedulerService.scheduleWeeklyReports();

    res.json({
      success: true,
      message: 'Reportes semanales programados exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error scheduling weekly reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📅 POST /api/scheduler/schedule-monthly
 * Programar reportes mensuales para todos los usuarios
 */
router.post('/schedule-monthly', async (req, res) => {
  try {
    console.log('📅 [API] Scheduling monthly reports');

    await schedulerService.scheduleMonthlyReports();

    res.json({
      success: true,
      message: 'Reportes mensuales programados exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error scheduling monthly reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🧹 POST /api/scheduler/cleanup
 * Limpiar tareas completadas antiguas
 */
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 [API] Cleaning up old tasks');

    schedulerService.cleanupOldTasks();

    res.json({
      success: true,
      message: 'Limpieza de tareas completada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error cleaning up tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔧 GET /api/scheduler/health
 * Verificar estado de salud del scheduler
 */
router.get('/health', async (req, res) => {
  try {
    const stats = schedulerService.getStats();
    
    const health = {
      status: stats.isRunning ? 'healthy' : 'stopped',
      uptime: stats.isRunning ? 'running' : 'stopped',
      totalTasks: stats.totalTasks,
      pendingTasks: stats.pendingTasks,
      failedTasks: stats.failedTasks,
      nextTask: stats.nextScheduledTask ? {
        type: stats.nextScheduledTask.type,
        scheduledFor: stats.nextScheduledTask.scheduledFor,
        userId: stats.nextScheduledTask.userId
      } : null,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      health,
      message: 'Estado de salud del scheduler obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting scheduler health:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
