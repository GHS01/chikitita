import express from 'express';
import { analyticsService } from '../services/analyticsService';
import { reportingService } from '../services/reportingService';

const router = express.Router();

/**
 * 📊 GET /api/analytics/progress/:userId
 * Obtener métricas de progreso
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;

    console.log('📊 [API] Getting progress metrics for user:', userId, 'days:', days);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const metrics = await analyticsService.calculateProgressMetrics(userId, days);

    res.json({
      success: true,
      metrics,
      message: 'Métricas de progreso obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting progress metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📈 GET /api/analytics/adherence/:userId
 * Obtener métricas de adherencia
 */
router.get('/adherence/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;

    console.log('📈 [API] Getting adherence metrics for user:', userId, 'days:', days);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const metrics = await analyticsService.calculateAdherenceMetrics(userId, days);

    res.json({
      success: true,
      metrics,
      message: 'Métricas de adherencia obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting adherence metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🎯 GET /api/analytics/effectiveness/:userId
 * Obtener métricas de efectividad
 */
router.get('/effectiveness/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;

    console.log('🎯 [API] Getting effectiveness metrics for user:', userId, 'days:', days);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const metrics = await analyticsService.calculateEffectivenessMetrics(userId, days);

    res.json({
      success: true,
      metrics,
      message: 'Métricas de efectividad obtenidas exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting effectiveness metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/analytics/dashboard/:userId
 * Obtener todas las métricas para el dashboard
 */
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;

    console.log('📊 [API] Getting dashboard metrics for user:', userId, 'days:', days);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    // Obtener todas las métricas en paralelo
    const [progressMetrics, adherenceMetrics, effectivenessMetrics] = await Promise.all([
      analyticsService.calculateProgressMetrics(userId, days),
      analyticsService.calculateAdherenceMetrics(userId, days),
      analyticsService.calculateEffectivenessMetrics(userId, days)
    ]);

    res.json({
      success: true,
      dashboard: {
        progress: progressMetrics,
        adherence: adherenceMetrics,
        effectiveness: effectivenessMetrics,
        lastUpdated: new Date().toISOString()
      },
      message: 'Dashboard de analytics obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📋 GET /api/analytics/reports/weekly/:userId
 * Generar reporte semanal
 */
router.get('/reports/weekly/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const weekStartDate = req.query.weekStartDate as string;

    console.log('📋 [API] Generating weekly report for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const report = await reportingService.generateWeeklyReport(userId, weekStartDate);

    res.json({
      success: true,
      report,
      message: 'Reporte semanal generado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error generating weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📋 GET /api/analytics/reports/monthly/:userId
 * Generar reporte mensual
 */
router.get('/reports/monthly/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const monthStartDate = req.query.monthStartDate as string;

    console.log('📋 [API] Generating monthly report for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    const report = await reportingService.generateMonthlyReport(userId, monthStartDate);

    res.json({
      success: true,
      report,
      message: 'Reporte mensual generado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 💾 POST /api/analytics/reports/weekly/:userId/save
 * Guardar reporte semanal en base de datos
 */
router.post('/reports/weekly/:userId/save', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const weekStartDate = req.query.weekStartDate as string;

    console.log('💾 [API] Saving weekly report for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    // Generar y guardar reporte
    const report = await reportingService.generateWeeklyReport(userId, weekStartDate);
    await reportingService.saveWeeklyReport(report);

    res.json({
      success: true,
      report,
      message: 'Reporte semanal guardado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error saving weekly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/analytics/summary/:userId
 * Obtener resumen rápido de métricas clave
 */
router.get('/summary/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    console.log('📊 [API] Getting analytics summary for user:', userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'userId debe ser un número válido'
      });
    }

    // Obtener métricas básicas de los últimos 7 días
    const [progressMetrics, adherenceMetrics] = await Promise.all([
      analyticsService.calculateProgressMetrics(userId, 7),
      analyticsService.calculateAdherenceMetrics(userId, 7)
    ]);

    const summary = {
      weeklyWorkouts: Math.round(adherenceMetrics.totalPlannedWorkouts),
      completionRate: Math.round(adherenceMetrics.completionRate),
      averageRpe: Math.round(progressMetrics.rpeMetrics.averageRpe * 10) / 10,
      totalVolume: Math.round(progressMetrics.strengthProgress.totalVolumeKg),
      streakDays: adherenceMetrics.streakDays,
      topMuscleGroups: Object.entries(progressMetrics.frequencyMetrics.muscleGroupFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([muscle]) => muscle)
    };

    res.json({
      success: true,
      summary,
      message: 'Resumen de analytics obtenido exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔍 GET /api/analytics/debug/:userId
 * DEBUG: Verificar datos del usuario
 */
router.get('/debug/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log('🔍 [DEBUG] Checking data for user:', userId);

    // Verificar sesiones
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('id, status, started_at, completed_at, workout_plan_id')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    // Verificar exercise_logs
    const { data: logs, error: logsError } = await supabase
      .from('exercise_logs')
      .select(`
        id, exercise_name, weight_used, reps_completed,
        workout_sessions!inner(id, user_id, status)
      `)
      .eq('workout_sessions.user_id', userId);

    // Verificar feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('workout_feedback_sessions')
      .select(`
        id, post_satisfaction, post_rpe, post_progress_feeling,
        workout_sessions!inner(id, user_id, status)
      `)
      .eq('workout_sessions.user_id', userId);

    // ✅ CORRECCIÓN: Usar validación mejorada para sesiones completadas
    const completedSessions = sessions?.filter(s =>
      s.status === 'completed' ||
      s.status === 'finished' ||
      (s.completed_at !== null && s.completed_at !== undefined)
    ) || [];

    res.json({
      success: true,
      debug: {
        totalSessions: sessions?.length || 0,
        completedSessions: completedSessions.length,
        sessions: sessions?.map(s => ({
          id: s.id,
          status: s.status,
          started_at: s.started_at,
          completed_at: s.completed_at
        })) || [],
        exerciseLogs: logs?.length || 0,
        feedback: feedback?.length || 0,
        errors: {
          sessions: sessionsError?.message,
          logs: logsError?.message,
          feedback: feedbackError?.message
        }
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
